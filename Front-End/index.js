const imageForm = document.querySelector("#imageForm");
const imageInput = document.querySelector("#imageInput");
const downloadBtn = document.querySelector("#downloadBtn");

imageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = imageInput.files[0];

  // Get secure URL for resize bucket from the server
  const { url } = await fetch("http://127.0.0.1:5501/s3Url/resize").then((res) =>
    res.json()
  );

  // Upload image to resize S3 bucket
  await fetch(url, {
    method: "PUT",
    body: file,
  });

  alert("Your image is processed. It is now ready to be  downloaded.");

  const imageUrl = url.split("?")[0];

  // Send resizing details to the backend
  const response = await fetch("http://127.0.0.1:5501/resize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });

  const { resizedImageUrl } = await response.json();

  // Enable the download button and set it up
  downloadBtn.disabled = false;
  downloadBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = resizedImageUrl;
    a.download = "resized-image.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Display the resized image
  const img = document.createElement("img");
  img.src = resizedImageUrl;
  document.body.appendChild(img);
});
