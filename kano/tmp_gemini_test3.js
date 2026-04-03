async function test() {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBOcfjx2o1Msk-Ddp8l0L9y43RuX86ngvE", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}
test();
