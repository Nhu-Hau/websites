"use client";
import React from "react";
import {
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaEnvelope,
  FaGlobe,
} from "react-icons/fa"; // Import các icon từ react-icons
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import AboutMe from "./components/AboutMe";
import LearningStats from "./components/LearningStats";

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Profile = () => {
  // Dữ liệu giả định cho biểu đồ tiến độ học tập
  const data = {
    labels: ["1st", "2nd", "3rd", "4th", "5th"], // Các ngày hoặc bài kiểm tra
    datasets: [
      {
        label: "Điểm học tập",
        data: [75, 80, 70, 85, 90], // Điểm của các ngày
        fill: false,
        borderColor: "#4caf50",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="py-32 px-4 sm:px-8 md:px-16 bg-gray-100 dark:bg-gray-900">
      <AboutMe />
      <LearningStats/>
    </div>
  );
};

export default Profile;
