async function reverse(lat, lng) {
  if (!lat || !lng || !process.env.GOOGLE_MAPS_KEY) return '';
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results?.[0]?.formatted_address || '';
  } catch (error) {
    return '';
  }
}
module.exports = { reverse };
