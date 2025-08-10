"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaEnvelope,
  FaGlobe,
} from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import { RiLockPasswordLine } from "react-icons/ri";

const AboutMe = () => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogout = () => {
    // Simulate logout (in a real app, this would clear auth tokens and redirect)
    alert("You have been logged out");
    // Add your logout logic here (e.g., clear localStorage, redirect to login)
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    // Simulate password change API call
    console.log("Changing password with:", { currentPassword, newPassword });
    alert("Password changed successfully");
    setIsPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8 items-center mb-9">
        {/* Image Section */}
        <div className="flex flex-row lg:flex-col gap-5">
          <div className="flex-shrink-0 w-40 h-40 lg:w-56 lg:h-56 rounded-full overflow-hidden border-4 border-gray-300 dark:border-gray-700 shadow-xl relative group">
            <Image
              src="/images/avt.png"
              alt="Profile Picture"
              className="w-full h-full object-cover"
              width={224}
              height={224}
            />
            <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
              <MdModeEdit className="text-white text-2xl transform transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>
          <div className="flex flex-col items-start justify-center">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <RiLockPasswordLine className="text-lg" />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <FiLogOut className="text-lg" />
              Log Out
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 w-full">
          {/* Profile Info Section */}
          <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              About Me
            </h2>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="flex flex-col py-3">
                <dt className="mb-1 text-gray-500 dark:text-gray-400 text-sm md:text-base">
                  First Name
                </dt>
                <div className="flex items-center justify-between">
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    Samuel
                  </dd>
                  <button className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transform transition-transform duration-200 hover:scale-110">
                    <MdModeEdit className="text-base" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col py-3">
                <dt className="mb-1 text-gray-500 dark:text-gray-400 text-sm md:text-base">
                  Last Name
                </dt>
                <div className="flex items-center justify-between">
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    Abera
                  </dd>
                  <button className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transform transition-transform duration-200 hover:scale-110">
                    <MdModeEdit className="text-base" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col py-3">
                <dt className="mb-1 text-gray-500 dark:text-gray-400 text-sm md:text-base">
                  Date of Birth
                </dt>
                <div className="flex items-center justify-between">
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    14/05/1977
                  </dd>
                  <button className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transform transition-transform duration-200 hover:scale-110">
                    <MdModeEdit className="text-base" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col py-3">
                <dt className="mb-1 text-gray-500 dark:text-gray-400 text-sm md:text-base">
                  Gender
                </dt>
                <div className="flex items-center justify-between">
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    Male
                  </dd>
                  <button className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transform transition-transform duration-200 hover:scale-110">
                    <MdModeEdit className="text-base" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="flex flex-col py-3">
                <dt className="mb-1 text-gray-500 dark:text-gray-400 text-sm md:text-base flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-gray-600 dark:text-gray-400" />
                  Location
                </dt>
                <div className="flex items-center justify-between">
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    Addis Ababa, Ethiopia
                  </dd>
                  <button className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transform transition-transform duration-200 hover:scale-110">
                    <MdModeEdit className="text-base" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col py-3">
                <dt className="mb-1 text-gray-500 dark:text-gray-400 text-sm md:text-base flex items-center">
                  <FaPhoneAlt className="mr-2 text-gray-600 dark:text-gray-400" />
                  Phone Number
                </dt>
                <div className="flex items-center justify-between">
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    +251 913 XXX 430
                  </dd>
                  <button className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transform transition-transform duration-200 hover:scale-110">
                    <MdModeEdit className="text-base" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col py-3">
                <dt className="mb-1 text-gray-500 dark:text-gray-400 text-sm md:text-base flex items-center">
                  <FaEnvelope className="mr-2 text-gray-600 dark:text-gray-400" />
                  Email
                </dt>
                <div className="flex items-center justify-between">
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    samuel@example.com
                  </dd>
                  <button className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transform transition-transform duration-200 hover:scale-110">
                    <MdModeEdit className="text-base" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col py-3">
                <dt className="mb-1 text-gray-500 dark:text-gray-400 text-sm md:text-base flex items-center">
                  <FaGlobe className="mr-2 text-gray-600 dark:text-gray-400" />
                  Website
                </dt>
                <div className="flex items-center justify-between">
                  <dd className="text-lg font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500">
                    <a
                      href="https://www.teclick.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      www.teclick.com
                    </a>
                  </dd>
                  <button className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transform transition-transform duration-200 hover:scale-110">
                    <MdModeEdit className="text-base" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Change Password
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AboutMe;
