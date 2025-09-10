// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD2nIB45KU_b4d7ggIP-ZKDIk82UY1ElJ8",
  authDomain: "asimsaadz-db8a5.firebaseapp.com",
  projectId: "asimsaadz-db8a5",
  storageBucket: "asimsaadz-db8a5.appspot.com",
  messagingSenderId: "201921568991",
  appId: "1:201921568991:web:46e4a57cd2bee11f3bc96a",
  measurementId: "G-P9NDKNYZFL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Redirect if not logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// DOM interactions
document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");
  const closeBtn = document.getElementById("close-btn");

  // --- SLIDER LOGIC ---
  const slidesContainer = document.getElementById("slides");
  if (slidesContainer) {
    const imageUrls = [
      "https://wkeo8cvbv1n9mxmr.public.blob.vercel-storage.com/asim.png",
      "https://wkeo8cvbv1n9mxmr.public.blob.vercel-storage.com/AI.png",
      "https://wkeo8cvbv1n9mxmr.public.blob.vercel-storage.com/Gemini_Generated_Image_2yvouf2yvouf2yvo.png",
    ];
    let allSlides = [];
    let currentSlide = 0;
    let autoSlideTimer;
    const slideDuration = 7000;

    function createSlides() {
      slidesContainer.innerHTML = "";
      imageUrls.forEach((url, index) => {
        const slide = document.createElement("div");
        slide.classList.add("slide");
        const img = document.createElement("img");
        img.src = url;
        img.alt = "Slider image " + (index + 1);
        slide.appendChild(img);
        slidesContainer.appendChild(slide);
      });
      allSlides = slidesContainer.querySelectorAll(".slide");
      if (allSlides.length > 0) {
        allSlides[0].classList.add("active");
      }
    }

    function showSlide(newIndex) {
      if (allSlides.length === 0) return;
      allSlides[currentSlide].classList.remove("active");
      currentSlide = newIndex;
      allSlides[currentSlide].classList.add("active");
      autoSlide(); // reset timer
    }

    function nextSlide() {
      if (allSlides.length === 0) return;
      const newIndex = (currentSlide + 1) % allSlides.length;
      showSlide(newIndex);
    }

    function prevSlide() {
      if (allSlides.length === 0) return;
      const newIndex = (currentSlide - 1 + allSlides.length) % allSlides.length;
      showSlide(newIndex);
    }

    function autoSlide() {
      clearTimeout(autoSlideTimer);
      autoSlideTimer = setTimeout(nextSlide, slideDuration);
    }

    document.getElementById("prev")?.addEventListener("click", prevSlide);
    document.getElementById("next")?.addEventListener("click", nextSlide);

    // Touch swipe
    let touchStartX = 0;
    slidesContainer.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        clearTimeout(autoSlideTimer);
      }
    });
    slidesContainer.addEventListener("touchend", (e) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        if (touchEndX - touchStartX > 50) {
          prevSlide();
        } else if (touchEndX - touchStartX < -50) {
          nextSlide();
        } else {
          autoSlide();
        }
      }
    });

    createSlides();
    autoSlide();
  }

  // Sticky Navbar
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("sticky", window.scrollY > 50);
  });

  // Mobile Menu
  hamburger?.addEventListener("click", () => {
    mobileMenu.classList.toggle("show");
    hamburger.classList.toggle("active");
  });
  closeBtn?.addEventListener("click", () => {
    mobileMenu.classList.remove("show");
    hamburger.classList.remove("active");
  });

  // Quotes Auto Switch
  const quotes = document.querySelectorAll(".quote");
  let quoteIndex = 0;
  function showQuote(idx) {
    quotes.forEach((q, i) => {
      q.classList.remove("active", "exit");
      if (i === idx) q.classList.add("active");
      else if (i === (idx - 1 + quotes.length) % quotes.length)
        q.classList.add("exit");
    });
  }
  function autoQuote() {
    setTimeout(() => {
      quoteIndex = (quoteIndex + 1) % quotes.length;
      showQuote(quoteIndex);
      autoQuote();
    }, window.innerWidth < 500 ? 2000 : 3500);
  }
  if (quotes.length > 0) {
    showQuote(quoteIndex);
    autoQuote();
  }

  // Content Box Animation
  const contentBoxes = document.querySelectorAll(".content-box");
  const observerOptions = { root: null, rootMargin: "0px", threshold: 0.1 };
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);
  contentBoxes.forEach((box) => observer.observe(box));
});
