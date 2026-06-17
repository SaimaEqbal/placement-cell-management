import { useEffect, useState } from "react";
import { getStudents } from "../api/studentApi";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await getStudents();
      setStudents(res.data);
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = students.length;

  const placedStudents = students.filter(
    (student) => student.placement_status === "placed"
  ).length;

  const unplacedStudents = students.filter(
    (student) => student.placement_status !== "placed"
  ).length;

  const averageCgpa =
    students.length > 0
      ? (
          students.reduce(
            (sum, student) => sum + parseFloat(student.cgpa || 0),
            0
          ) / students.length
        ).toFixed(2)
      : 0;

  const recentStudents = [...students]
    .sort(
      (a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    )
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
          Placement Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Overview of students and placement statistics
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

        <StatCard
          title="Total Students"
          value={totalStudents}
          icon="👨‍🎓"
        />

        <StatCard
          title="Placed Students"
          value={placedStudents}
          icon="✅"
        />

        <StatCard
          title="Unplaced Students"
          value={unplacedStudents}
          icon="⏳"
        />

        <StatCard
          title="Average CGPA"
          value={averageCgpa}
          icon="⭐"
        />

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Students */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow p-6">

          <h2 className="text-xl font-semibold mb-4">
            Recent Students
          </h2>

          <div className="space-y-4">

            {recentStudents.map((student) => (
              <div
                key={student.id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-3"
              >
                <div>
                  <h3 className="font-semibold">
                    {student.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {student.roll_no}
                  </p>
                </div>

                <div className="mt-2 sm:mt-0">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      student.placement_status === "placed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {student.placement_status}
                  </span>
                </div>
              </div>
            ))}

          </div>

        </div>

        {/* Placement Summary */}
        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-xl font-semibold mb-6">
            Placement Summary
          </h2>

          <div className="space-y-5">

            <SummaryItem
              label="Placed"
              value={placedStudents}
              total={totalStudents}
              color="bg-green-500"
            />

            <SummaryItem
              label="Unplaced"
              value={unplacedStudents}
              total={totalStudents}
              color="bg-yellow-500"
            />

          </div>

          <div className="mt-8 border-t pt-4">

            <p className="text-gray-600">
              Placement Rate
            </p>

            <h3 className="text-3xl font-bold mt-2">
              {totalStudents > 0
                ? (
                    (placedStudents / totalStudents) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </h3>

          </div>

        </div>

      </div>

    </div>
  );
}

/* Statistic Card */
function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">

      <div className="flex justify-between items-center">

        <div>
          <p className="text-gray-500 text-sm">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>
        </div>

        <div className="text-4xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* Summary Progress */
function SummaryItem({
  label,
  value,
  total,
  color,
}) {
  const percentage =
    total > 0 ? (value / total) * 100 : 0;

  return (
    <div>

      <div className="flex justify-between mb-2">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">

        <div
          className={`${color} h-3 rounded-full`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}