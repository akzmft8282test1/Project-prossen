require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const APP_SLUG = process.env.APP_SLUG || "prison-app-1";

if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
  console.error(
    "❌ 오류: .env 파일의 SUPABASE_URL을 올바른 HTTP/HTTPS 주소로 입력해주세요.",
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 1. 회원가입 API (auth.users + ext_user_profiles 자동 연동)
app.post("/api/signup", async (req, res) => {
  const { email, password, nickname } = req.body;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  if (data.user) {
    // 프로필 테이블 생성
    await supabase
      .from("ext_user_profiles")
      .insert([
        { id: data.user.id, email: data.user.email, nickname: nickname || "" },
      ]);
  }

  res.json({ message: "회원가입 완료", user: data.user });
});

// 2. 로그인 API
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return res.status(400).json({ error: error.message });

  res.json({ token: data.session.access_token, user: data.user });
});

// 3. 트래픽/경로 기록 저장 API (Supabase DB 저장 연동)
app.post("/api/traffic", async (req, res) => {
  const authHeader = req.headers.authorization;
  let userId = null;

  // 토큰 검증 및 사용자 추출
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (user) userId = user.id;
  }

  const { url, transition, redirectPath } = req.body;

  const { error } = await supabase.from("ext_traffic_logs").insert([
    {
      user_id: userId,
      app_slug: APP_SLUG, // 어떤 확장 프로그램/서버에서 올렸는지 식별
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

// 4. 화면 효과/개인 설정 저장 API
app.post("/api/settings", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "인증 헤더가 없습니다." });

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user)
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });

  const { settings } = req.body; // 예: { blur: true, rotate: false }

  const { data, error } = await supabase.from("ext_user_settings").upsert(
    {
      user_id: user.id,
      app_slug: APP_SLUG,
      settings: settings,
      updated_at: new Date(),
    },
    { onConflict: "user_id, app_slug" },
  );

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "설정이 저장되었습니다.", data });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`[${APP_SLUG}] Server running on port ${PORT}`),
);
