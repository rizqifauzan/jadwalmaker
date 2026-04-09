async function test() {
  try {
    const response = await fetch("https://ai.sumopod.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-IUUSenbUaKES7GPnx_WxjA"
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: "Reply 'OK' if you receive this." }],
        temperature: 0.1,
      }),
    });
    console.log(response.status, await response.text());
  } catch(e) {
    console.error("Caught error:", e);
    console.error("Cause:", e.cause);
  }
}
test();
