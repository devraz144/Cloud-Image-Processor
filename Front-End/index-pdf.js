const imageForm = document.querySelector("#imageForm");
const imageInput = document.querySelector("#imageInput");
const downloadBtn = document.querySelector("#downloadBtn");

imageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const files = imageInput.files;

  if (!files.length) {
    alert("Please select at least one image.");
    return;
  }

  const imageUrls = [];

  try {
    // Upload images and get their URLs
    for (let i = 0; i < files.length; i++) {
      // Fetch a new pre-signed URL for each file
      const { url } = await fetch("http://127.0.0.1:5501/s3Url/pdf").then((res) => res.json());

      // Upload the file to the pre-signed URL
      await fetch(url, {
        method: "PUT",
        body: files[i],
      });

      // Extract the file's public URL (without the query string)
      imageUrls.push(url.split("?")[0]);
    }

    alert("Images uploaded successfully. Processing the PDF...");

    // Send image URLs to the backend to generate the PDF
    const response = await fetch("http://127.0.0.1:5501/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrls }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.statusText}`);
    }

    const { pdfUrl } = await response.json();

    // Enable the download button and set it up
    downloadBtn.disabled = false;
    downloadBtn.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "images.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

    // Display the PDF link
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.textContent = "Download PDF";
    link.style.display = "block";
    document.body.appendChild(link);

    alert("PDF generated successfully!");
  } catch (error) {
    console.error("Error processing the PDF:", error);
    alert(`Error: ${error.message}`);
  }
});
