const imageForm = document.querySelector("#imageForm");
const imageInput = document.querySelector("#imageInput");
const downloadBtn = document.querySelector("#downloadBtn");

imageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = imageInput.files[0];

  // Get secure URL for grayscale bucket from the server
  const { url } = await fetch("http://127.0.0.1:5501/s3Url/greyscale").then((res) =>
    res.json()
  );

  // Upload image to grayscale S3 bucket
  await fetch(url, {
    method: "PUT",
    body: file,
  });

  alert("Your image is processed. It is now ready to be  downloaded.");

  const imageUrl = url.split("?")[0];

  // Send grayscale details to the backend
  const response = await fetch("http://127.0.0.1:5501/greyscale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });

  const { grayscaleImageUrl } = await response.json();

  // Enable the download button and set it up
  downloadBtn.disabled = false;
  downloadBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = grayscaleImageUrl;
    a.download = "grayscale-image.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Display the grayscale image
  const img = document.createElement("img");
  img.src = grayscaleImageUrl;
  document.body.appendChild(img);
});
