import fs from 'fs';

async function test() {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBOcfjx2o1Msk-Ddp8l0L9y43RuX86ngvE");
  const data = await res.json();
  fs.writeFileSync("models.txt", "Models: " + data.models?.map(m => m.name).join(", "), "utf8");
}
test();
