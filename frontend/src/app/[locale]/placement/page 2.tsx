/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/pages/placement.tsx
"use client"
import { useEffect, useState } from "react";

const PlacementPage = () => {
  const [placementData, setPlacementData] = useState<any>(null);

  // Fetch placement data từ backend
  useEffect(() => {
    const fetchPlacementData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/placement'); // Backend API URL
        if (!response.ok) {
          throw new Error('Failed to fetch placement data');
        }
        const data = await response.json();
        setPlacementData(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPlacementData();
  }, []);

  if (!placementData) return <p>Loading...</p>;

  return (
    <div>
      <h1>{placementData.title}</h1>
      <h2>{placementData.type}</h2>
      <p>Duration: {placementData.durationMin} minutes</p>
      <p>Total Questions: {placementData.totalQuestions}</p>

      {/* Hiển thị từng phần của bài Placement */}
      <div>
        {placementData.parts && Object.keys(placementData.parts).map((partKey) => (
          <div key={partKey}>
            <h3>{placementData.parts[partKey].description}</h3>
            {placementData.parts[partKey].items.map((item: any, index: number) => (
              <div key={index}>
                <p>{item.questionId}</p>
                <audio controls>
                  <source src={item.audio} type="audio/mpeg" />
                </audio>
                {item.options.map((option: string, i: number) => (
                  <button key={i}>{option}</button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlacementPage;
