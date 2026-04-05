const { app } = require('electron');
const { Auth } = require('msmc');

app.on('ready', async () => {
  try {
    const auth = new Auth("select_account");
    const xbox = await auth.launch("electron");
    const mc = await xbox.getMinecraft();
    console.log("Logged in as", mc.profile.name);
    console.log("MCLC User Object:", mc.mclc());
  } catch (e) {
    console.error("Error logging in:", e);
  }
  app.quit();
});
