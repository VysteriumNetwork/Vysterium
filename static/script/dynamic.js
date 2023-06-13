export async function DynamicBare() {
    try {
      const response = await fetch('/server/');
      const data = await response.json();
      return data.bare;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
  