"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [topics, setTopics] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/topics")
      .then((res) => res.json())
      .then((data) => setTopics(data.topics || []))
      .catch((err) => console.error("Failed to fetch topics", err));

    fetch("http://localhost:8000/api/courses")
      .then((res) => res.json())
      .then((data) => setCourses(data.courses || []))
      .catch((err) => console.error("Failed to fetch courses", err));
  }, []);

  const toggleInterest = (topic) => {
    setSelectedInterests((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const toggleCompleted = (course) => {
    setCompletedCourses((prev) =>
      prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedInterests.length === 0) return alert("Please select at least one interest!");

    setIsLoading(true);
    setHasQueried(true);
    try {
      const res = await fetch("http://localhost:8000/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: selectedInterests,
          completed_courses: completedCourses,
        }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="text-center mb-12 mt-8">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 pb-2">
            Smart Course Recommender
          </h1>
          <p className="mt-4 text-lg text-slate-400 font-medium tracking-wide">
            Powered by Semantic Web (RDF &amp; SPARQL)
          </p>
        </header>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <div className="md:col-span-5 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-white/90">Tell us about yourself</h2>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Student Name */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Student Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alice"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              {/* Completed Courses — clickable tag list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-400">
                    Completed Courses
                    {completedCourses.length > 0 && (
                      <span className="ml-2 bg-purple-500/30 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-500/40">
                        {completedCourses.length} selected
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCompleted((v) => !v)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    {showCompleted ? "▲ Hide" : "▼ Expand"}
                  </button>
                </div>

                {/* Selected badges (always visible) */}
                {completedCourses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {completedCourses.map((c) => (
                      <span
                        key={c}
                        onClick={() => toggleCompleted(c)}
                        className="cursor-pointer px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-600/40 to-emerald-600/40 text-green-300 border border-green-500/30 hover:opacity-70 transition-opacity flex items-center gap-1"
                      >
                        ✓ {c} <span className="text-green-400/60">×</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Expandable course list */}
                {showCompleted && (
                  <div className="flex flex-wrap gap-2 mt-2 max-h-44 overflow-y-auto pr-1 custom-scroll">
                    {courses.length > 0 ? courses.map((course) => (
                      <button
                        key={course}
                        type="button"
                        onClick={() => toggleCompleted(course)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                          completedCourses.includes(course)
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-500/20 border border-transparent"
                            : "bg-slate-800/60 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
                        }`}
                      >
                        {completedCourses.includes(course) ? "✓ " : ""}{course}
                      </button>
                    )) : (
                      <div className="text-xs text-slate-500 animate-pulse py-2">Loading courses...</div>
                    )}
                  </div>
                )}

                {completedCourses.length === 0 && !showCompleted && (
                  <p className="text-xs text-slate-600 italic">Click ▼ Expand to select completed courses</p>
                )}
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Select Your Fields</label>
                <div className="flex flex-wrap gap-2">
                  {topics.length > 0 ? topics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleInterest(topic)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                        selectedInterests.includes(topic)
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 border border-transparent"
                          : "bg-slate-800/60 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
                      }`}
                    >
                      {topic}
                    </button>
                  )) : (
                    <div className="text-sm text-purple-400 animate-pulse w-full py-2 bg-purple-500/10 rounded-xl text-center border border-purple-500/20">
                      Loading topics from Semantic Engine...
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-900/20"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running SPARQL...
                  </span>
                ) : "Get Recommendations"}
              </button>
            </form>
          </div>

          {/* Right Column: Results */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-2xl font-semibold text-white/90">Your Recommendations</h2>
              {hasQueried && !isLoading && (
                <span className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 px-3 py-1 rounded-full">
                  {recommendations.length} course{recommendations.length !== 1 ? "s" : ""} found
                </span>
              )}
            </div>

            {!hasQueried && !isLoading && (
              <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] text-center h-[28rem] flex flex-col justify-center items-center">
                <div className="w-16 h-16 mb-6 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                  <span className="text-2xl">🪄</span>
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Discover?</h3>
                <p className="text-slate-500 max-w-xs">Select your interests and click recommend to see suggestions based on your Semantic profile.</p>
              </div>
            )}

            {hasQueried && !isLoading && recommendations.length === 0 && (
              <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] text-center h-[28rem] flex flex-col justify-center items-center">
                <div className="w-16 h-16 mb-6 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                  <span className="text-2xl">🎓</span>
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-2">All Caught Up!</h3>
                <p className="text-slate-500 max-w-xs">You've completed all courses in your selected interest areas. Try adding more interests!</p>
              </div>
            )}

            <div className="space-y-4">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="group bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[1.5rem] shadow-xl transition-all duration-500 hover:bg-white/10 hover:scale-[1.01] hover:border-white/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all">
                        {rec.course}
                      </h3>
                      <p className="mt-3 text-sm text-slate-400 flex items-center gap-2 font-medium">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        {rec.reason}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border border-pink-500/20 shadow-sm shadow-pink-500/10 whitespace-nowrap">
                      Highly Match
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
