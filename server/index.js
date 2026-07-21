require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const APP_SLUG = process.env.APP_SLUG || "prison-app-1";
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_key";

if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
  console.error("❌ 오류: .env 파일의 SUPABASE_URL을 확인해주세요.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 1. 커스텀 회원가입 (자체 테이블 저장 + 비밀번호 bcrypt 암호화)
app.post("/api/signup", async (req, res) => {
  const { email, password, nickname } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력해주세요." });
  }

  // 중복 사용자 확인
  const { data: existingUser } = await supabase
    .from("ext_custom_users")
    .select("id")
    .eq("app_slug", APP_SLUG)
    .eq("email", email)
    .single();

  if (existingUser) {
    return res.status(400).json({ error: "이미 가입된 이메일입니다." });
  }

  // 비밀번호 암호화 (bcrypt 해싱)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 커스텀 DB에 저장
  const { data, error } = await supabase
    .from("ext_custom_users")
    .insert([
      {
        app_slug: APP_SLUG,
        email: email,
        nickname: nickname || "",
        password_hash: hashedPassword,
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "회원가입 완료", userId: data.id });
});

// 2. 커스텀 로그인 (JWT_SECRET 기반 토큰 발행)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // DB에서 유저 조회
  const { data: user, error } = await supabase
    .from("ext_custom_users")
    .select("*")
    .eq("app_slug", APP_SLUG)
    .eq("email", email)
    .single();

  if (error || !user) {
    return res
      .status(400)
      .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }

  // 비밀번호 검증
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res
      .status(400)
      .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }

  // .env의 JWT_SECRET으로 JWT 토큰 암호화 발행
  const token = jwt.sign(
    { userId: user.id, email: user.email, appSlug: APP_SLUG },
    JWT_SECRET,
    { expiresIn: "7d" }, // 토큰 유효기간 7일
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, nickname: user.nickname },
  });
});

// 3. 트래픽/경로 기록 저장 API (발행한 JWT 토큰 검증)
app.post("/api/traffic", async (req, res) => {
  const authHeader = req.headers.authorization;
  let userId = null;

  // 인증 토큰 검증
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      console.log("유효하지 않거나 만료된 JWT 토큰입니다.");
    }
  }

  const { url, transition, redirectPath } = req.body;

  const { error } = await supabase.from("ext_traffic_logs").insert([
    {
      user_id: userId,
      app_slug: APP_SLUG,
      url: url,
      transition_type: transition || "link",
      redirect_path: redirectPath || [],
    },
  ]);

  if (error) {
    console.error("로그 저장 실패:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ status: "success", app: APP_SLUG });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`[${APP_SLUG}] Server running on port ${PORT}`),
);
