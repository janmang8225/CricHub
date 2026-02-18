const BASE_URL = "http://localhost:3000";

const ADMIN_EMAIL = "a@test.com";
const ADMIN_PASSWORD = "123456";

const SCORER_EMAIL = "u1@test.com";
const SCORER_PASSWORD = "123456";

const MATCH_ID = "4226ddc0-12af-4f9c-a24b-50c9ce3b5e1b";
const TEAM_A_ID = "583b8579-5e42-4766-9a8f-082a6b38c271";

const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

async function runTest() {
  console.log("1. Admin login...");
  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log("✔ Admin logged in");

  console.log("2. Scorer login...");
  const scorer = await login(SCORER_EMAIL, SCORER_PASSWORD);
  console.log("✔ Scorer logged in");

  await wait(500);

  console.log("3. Assign scorer to match...");
  await fetch(`${BASE_URL}/matches/${MATCH_ID}/scorers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${admin.token}`
    },
    body: JSON.stringify({ userId: scorer.userId })
  });
  console.log("✔ Scorer assigned");

  await wait(500);

  console.log("4. Update score (scorer)...");
  await fetch(`${BASE_URL}/matches/${MATCH_ID}/scores`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${scorer.token}`
    },
    body: JSON.stringify({
      teamId: TEAM_A_ID,
      runs: 12,
      wickets: 1,
      overs: 2.3
    })
  });
  console.log("✔ Score updated");

  await wait(500);

  console.log("5. Read score...");
  const scoreRes = await fetch(`${BASE_URL}/matches/${MATCH_ID}/score`);
  console.log(await scoreRes.json());

  console.log("✅ SCORE TEST COMPLETED");
}

runTest().catch(err => {
  console.error("❌ TEST FAILED", err);
});
