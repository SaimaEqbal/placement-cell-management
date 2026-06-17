import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents ,deleteStudent,} from "../../api/studentApi";


export default function StudentPage() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const res = await getStudents();

      setStudents(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

const handleDelete = async (id) => { const confirmDelete = window.confirm( "Are you sure you want to delete this student?" ); if (!confirmDelete) return; try { await deleteStudent(id); fetchStudents(); } catch (err) { console.error("Delete failed:", err); } };
  
  const handleSearch = (value) => {
    setSearch(value);

    const result = students.filter((student) =>
      [
        student.name,
        student.roll_no,
        student.email,
        student.phone,
        student.branch,
        student.region,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value.toLowerCase())
    );

    setFiltered(result);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">
            Student Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and track student records
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, roll no, email, phone, branch..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          Loading students...
        </div>
      )}

      {/* No Students */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          No students found
        </div>
      )}

      {/* Desktop Table */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="hidden lg:block bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left">Roll No</th>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Phone</th>
                    <th className="p-4 text-left">Branch</th>
                    <th className="p-4 text-left">CGPA</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((student) => (
                    <tr
                      key={student.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4">{student.roll_no}</td>

                      <td className="p-4 font-medium">
                        {student.name}
                      </td>

                      <td className="p-4">{student.email}</td>

                      <td className="p-4">{student.phone}</td>

                      <td className="p-4">{student.branch}</td>

                      <td className="p-4">{student.cgpa}</td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            student.placement_status === "placed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {student.placement_status}
                        </span>
                      </td>

                      <td className="p-4">
  <div className="flex gap-2 flex-wrap">

    <button
      onClick={() =>
        navigate(`/students/${student.id}`)
      }
      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
    >
      Details
    </button>

    <button
      onClick={() =>
        navigate(`/students/edit/${student.id}`)
      }
      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm"
    >
      Edit
    </button>

    <button
      onClick={() => handleDelete(student.id)}
      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
    >
      Delete
    </button>

  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet Cards */}
          <div className="lg:hidden space-y-4">
            {filtered.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-xl shadow p-4"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h2 className="font-bold text-lg">
                      {student.name}
                    </h2>

                    <p className="text-gray-500 text-sm">
                      {student.roll_no}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      student.placement_status === "placed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {student.placement_status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <strong>Email:</strong> {student.email}
                  </p>

                  <p>
                    <strong>Phone:</strong> {student.phone}
                  </p>

                  <p>
                    <strong>Branch:</strong> {student.branch}
                  </p>

                  <p>
                    <strong>CGPA:</strong> {student.cgpa}
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate(`/students/${student.id}`)
                  }
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-6 text-gray-600 text-sm sm:text-base">
        Total Students:{" "}
        <span className="font-semibold">
          {filtered.length}
        </span>
      </div>
    </div>
  );
}