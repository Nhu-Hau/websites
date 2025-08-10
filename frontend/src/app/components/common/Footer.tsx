"use client";
import React from "react";
import Link from "next/link";
// import SocialIcons from "./SocialIcons";

const Footer = () => {
  return (
    <footer
      itemScope
      itemType="https://schema.org/WPFooter"
      className="bg-gray-800 dark:bg-gray-800 text-gray-100 dark:text-gray-100 py-12 z-40"
    >
      <div className="max-w-screen-xl 2xl:max-w-screen-2xl mx-auto px-4 2xl:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 2xl:gap-16 mb-12">
          {/* About Section */}
          <div>
            <h5 className="text-lg md:text-xl 2xl:text-2xl font-bold mb-4">
              About TOEIC Prep
            </h5>
            <p className="text-sm md:text-base 2xl:text-lg leading-relaxed text-justify 2xl:leading-loose">
              TOEIC Prep Hub is your go-to platform for mastering the TOEIC
              Listening and Reading test. Our goal is to help learners improve
              their English proficiency through realistic test simulations,
              instant scoring, and in-depth explanations.
            </p>
          </div>

          {/* Support Links */}
          <div className="md:mx-auto">
            <h4 className="text-lg md:text-xl 2xl:text-2xl font-bold mb-4">
              Support
            </h4>
            <ul className="space-y-2 text-sm md:text-base 2xl:text-lg">
              {[
                { href: "#faq", label: "Frequently Asked Questions" },
                { href: "#support", label: "Customer Support" },
                { href: "#returns", label: "Refund Policy" },
                { href: "#terms", label: "Terms of Use" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    rel="nofollow"
                    className="hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-200"
                    aria-label={item.label}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h5 className="text-lg md:text-xl 2xl:text-2xl font-bold mb-4">
              Contact Us
            </h5>
            <ul className="space-y-2 text-sm md:text-base 2xl:text-lg">
              <li>
                <strong>Phone:</strong> 0833115510 – 0878845757
              </li>
              <li>
                <strong>Email:</strong> support@toeicprephub.com
              </li>
              <li>
                <strong>Address:</strong> 748/33 Thong Nhat Street, An Hoi Dong
                Ward, Ho Chi Minh City
              </li>
              {/* <SocialIcons /> */}
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="border-t border-gray-300 dark:border-gray-600 pt-6 text-center text-sm 2xl:text-base text-gray-400 dark:text-gray-400">
          © {new Date().getFullYear()} TOEIC Prep Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
