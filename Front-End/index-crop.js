const imageForm = document.querySelector('#imageForm');
const imageInput = document.querySelector('#imageInput');
const downloadBtn = document.querySelector('#downloadBtn');

imageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = imageInput.files[0];

  // Ensure crop inputs exist
  const cropX = parseInt(document.querySelector('#cropX').value, 10);
  const cropY = parseInt(document.querySelector('#cropY').value, 10);
  const cropWidth = parseInt(document.querySelector('#cropWidth').value, 10);
  const cropHeight = parseInt(document.querySelector('#cropHeight').value, 10);

  if (isNaN(cropX) || isNaN(cropY) || isNaN(cropWidth) || isNaN(cropHeight)) {
    alert('Invalid crop dimensions. Please check your inputs.');
    return;
  }

  try {
    // Get secure URL for crop bucket from the server
    const { url } = await fetch('http://127.0.0.1:5501/s3Url/crop').then((res) =>
      res.json()
    );

    // Upload image to crop S3 bucket
    await fetch(url, {
      method: 'PUT',
      body: file,
    });

    const imageUrl = url.split('?')[0];

    // Send crop details to the backend
    const response = await fetch('http://127.0.0.1:5501/crop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, x: cropX, y: cropY, width: cropWidth, height: cropHeight }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Crop API Error: ${errorText}`);
    }

    const { croppedImageUrl } = await response.json();

    if (!croppedImageUrl) {
      throw new Error('Cropped image URL missing in response');
    }

    // Enable the download button and set it up
    downloadBtn.disabled = false;
    downloadBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = croppedImageUrl;
      a.download = 'cropped-image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

    // Display the cropped image
    const img = document.createElement('img');
    img.src = croppedImageUrl;
    document.body.appendChild(img);
  } catch (error) {
    console.error(error);
    alert('Error processing the image. Please try again.');
  }
});
