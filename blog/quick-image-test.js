// Quick test without database connection
console.log('🔍 Testing image API directly...');

// Test if the blog server is running
fetch('http://localhost:4321/api/uploads/amour-couple-vaccine-non-vax.jpg')
  .then(response => {
    console.log('✅ Image API Status:', response.status);
    console.log('✅ Image API Headers:', response.headers.get('content-type'));
    return response.blob();
  })
  .then(blob => {
    console.log('✅ Image size:', blob.size, 'bytes');
    console.log('✅ Image type:', blob.type);
  })
  .catch(error => {
    console.error('❌ Image API Error:', error.message);
  });
