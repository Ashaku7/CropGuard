interface WeatherData {
  temp: number;
  humidity: number;
  rainfall: number;
  location: string;
  description: string;
}

interface PestRisk {
  level: 'Low' | 'Moderate' | 'High';
  color: string;
  icon: string;
  message: string;
}

export class WeatherService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
  }

  async getWeather(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      const response = await fetch(
        `${this.apiUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        rainfall: data.rain?.['1h'] || 0,
        location: data.name,
        description: data.weather[0].description,
      };
    } catch (error) {
      console.error('Weather service error:', error);
      return null;
    }
  }

  async getWeatherByCity(city: string): Promise<WeatherData | null> {
    try {
      const response = await fetch(
        `${this.apiUrl}?q=${city},IN&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        rainfall: data.rain?.['1h'] || 0,
        location: data.name,
        description: data.weather[0].description,
      };
    } catch (error) {
      console.error('Weather service error:', error);
      return null;
    }
  }

  calculatePestRisk(weather: WeatherData): PestRisk {
    const { temp, humidity, rainfall } = weather;

    // High risk conditions for fungal diseases
    if (humidity > 80 && temp > 25 && temp < 35) {
      return {
        level: 'High',
        color: 'red',
        icon: '🔴',
        message: 'High fungal disease risk. Monitor crops closely and apply preventive treatments.',
      };
    }

    // High risk for bacterial diseases
    if (humidity > 85 && rainfall > 5) {
      return {
        level: 'High',
        color: 'red',
        icon: '🔴',
        message: 'High risk of bacterial infections due to rain and humidity. Ensure proper drainage.',
      };
    }

    // Moderate risk
    if (humidity > 60 && temp > 20) {
      return {
        level: 'Moderate',
        color: 'yellow',
        icon: '🟡',
        message: 'Moderate disease risk. Monitor your crops and maintain field hygiene.',
      };
    }

    // Low risk
    return {
      level: 'Low',
      color: 'green',
      icon: '🟢',
      message: 'Low disease risk. Good conditions for healthy crop growth.',
    };
  }

  // Mock weather for offline/testing
  getMockWeather(location: string): WeatherData {
    return {
      temp: 28,
      humidity: 75,
      rainfall: 2,
      location: location,
      description: 'partly cloudy',
    };
  }
}

export const weatherService = new WeatherService();