const client = LDClient.initialize(
  "61409b046ca8d52601d179ef",
  {
    key: "anonymous",
  },
  {
    bootstrap: window.ldFlags,
  }
);
client.on("ready", async function () {
  const showAboutUs = await client.variation("show-about-us", false);
  displayAboutUs(showAboutUs);
});

client.on("change", async function () {
  const showAboutUs = await client.variation("show-about-us", false);
  displayAboutUs(showAboutUs);
});

function displayAboutUs(variation) {
  const aboutUsDiv = document.getElementById("about");
  const aboutUsNav = document.querySelector(".navbar-item[href='#about']");
  if (variation) {
    console.log("show-about-us is true");
    aboutUsDiv.style.display = "block";
    aboutUsNav.style.display = "inherit";
  } else {
    console.log("show-about-us is false");
    aboutUsDiv.style.display = "none";
    aboutUsNav.style.display = "none";
  }
}
