import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { BackButton } from '../components/BackButton';
import { Save, Edit2, Trash2, ArrowUpDown } from 'lucide-react';
import { database } from '../lib/firebase';
import { ref, push, set, update, remove, onValue } from 'firebase/database';
import { getCurrentUser } from '../lib/auth';

interface Student {
  id: string;
  name: string;
  school: string;
  class: string;
  age: number;
  gender: 'male' | 'female';
  key?: string;
}

type SortField = 'id' | 'name' | 'class' | 'school' | 'age' | 'gender';
type SortDirection = 'asc' | 'desc';

export default function StudentRegistration() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const canAccess =
      currentUser.role === 'administrator' ||
      currentUser.role === 'registry';
    if (!canAccess) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    class: '',
    age: '',
    gender: '',
  });
  const [editKey, setEditKey] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Load students from Firebase with real-time updates
  useEffect(() => {
    const studentsRef = ref(database, 'students');
    
    const unsubscribe = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const studentsList: Student[] = Object.keys(data).map((key) => ({
          ...data[key],
          key,
        }));
        setStudents(studentsList);
        // Also save to localStorage as backup
        localStorage.setItem('students', JSON.stringify(studentsList));
      } else {
        setStudents([]);
        localStorage.setItem('students', JSON.stringify([]));
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync selectAll checkbox state with actual selections
  useEffect(() => {
    if (selectedStudents.size === 0) {
      setSelectAll(false);
    } else if (students.length > 0 && selectedStudents.size === students.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedStudents, students]);

  const generateID = (gender: 'male' | 'female') => {
  const prefix = gender === 'male' ? 'M' : 'F';

  const genderStudents = students.filter(
    (student) => student.gender === gender
  );

  const nextNumber = genderStudents.length + 1;

  return `${prefix}${String(nextNumber).padStart(2, '0')}`;
};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (editKey !== null) {
      // Update existing student
      const studentRef = ref(database, `students/${editKey}`);
      const updatedData = {
        name: formData.name,
        school: formData.school,
        class: formData.class,
        age: formData.age,
        gender: formData.gender,
      };
      
      await update(studentRef, updatedData);
      setEditKey(null);
    } else {
      // Add new student
      const studentsRef = ref(database, 'students');
      const newStudent = {
  id: generateID(formData.gender as 'male' | 'female'),
        name: formData.name,
        school: formData.school,
        class: formData.class,
        age: formData.age,
        gender: formData.gender,
      };
      
      await push(studentsRef, newStudent);
    }

    setFormData({ name: '', school: '', class: '', age: '', gender: '' });
  };

  const handleEdit = (student: Student) => {
    setFormData({
      name: student.name,
      school: student.school,
      class: student.class,
      age: student.age.toString(),
      gender: student.gender,
    });
    setEditKey(student.key || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (key: string) => {
    if (window.confirm('Delete this student?')) {
      const studentRef = ref(database, `students/${key}`);
      await remove(studentRef);
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelect = (key: string) => {
    const newSelectedStudents = new Set(selectedStudents);
    if (newSelectedStudents.has(key)) {
      newSelectedStudents.delete(key);
    } else {
      newSelectedStudents.add(key);
    }
    setSelectedStudents(newSelectedStudents);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map((student) => student.key!)));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select students to delete');
      return;
    }

    if (window.confirm(`Delete ${selectedStudents.size} selected student${selectedStudents.size > 1 ? 's' : ''}?`)) {
      const promises = Array.from(selectedStudents).map((key) => {
        const studentRef = ref(database, `students/${key}`);
        return remove(studentRef);
      });
      await Promise.all(promises);
      setSelectedStudents(new Set());
      setSelectAll(false);
    }
  };

  const handleDeleteAll = async () => {
    if (students.length === 0) {
      alert('No students to delete');
      return;
    }

    if (window.confirm(`Delete ALL ${students.length} students? This action cannot be undone!`)) {
      const studentsRef = ref(database, 'students');
      await remove(studentsRef);
      setSelectedStudents(new Set());
      setSelectAll(false);
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    if (sortField === 'id' || sortField === 'age') {
      return sortDirection === 'asc'
        ? (a[sortField] as number) - (b[sortField] as number)
        : (b[sortField] as number) - (a[sortField] as number);
    } else {
      return sortDirection === 'asc'
        ? (a[sortField] as string).localeCompare(b[sortField] as string)
        : (b[sortField] as string).localeCompare(a[sortField] as string);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
            Student Contestant Registration
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                School
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) =>
                  setFormData({ ...formData, school: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Class
              </label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) =>
                  setFormData({ ...formData, class: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Age
              </label>
              <input
                type="number"
                min="5"
                max="25"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })
                }
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <Save className="w-5 h-5" />
              {editKey ? 'Update Student' : 'Save Student'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    BIB
                    <ArrowUpDown className="w-4 h-4 inline-block ml-1" />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    <ArrowUpDown className="w-4 h-4 inline-block ml-1" />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-slate-700 hidden lg:table-cell cursor-pointer"
                    onClick={() => handleSort('school')}
                  >
                    School
                    <ArrowUpDown className="w-4 h-4 inline-block ml-1" />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-slate-700 hidden md:table-cell cursor-pointer"
                    onClick={() => handleSort('class')}
                  >
                    Class
                    <ArrowUpDown className="w-4 h-4 inline-block ml-1" />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-slate-700 hidden sm:table-cell cursor-pointer"
                    onClick={() => handleSort('age')}
                  >
                    Age
                    <ArrowUpDown className="w-4 h-4 inline-block ml-1" />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer"
                    onClick={() => handleSort('gender')}
                  >
                    Gender
                    <ArrowUpDown className="w-4 h-4 inline-block ml-1" />
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No students registered yet
                    </td>
                  </tr>
                ) : (
                  sortedStudents.map((student) => (
                    <tr
                      key={student.key}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.key!)}
                          onChange={() => handleSelect(student.key!)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {student.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">
                        {student.school}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                        {student.class}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 hidden sm:table-cell">
                        {student.age}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.gender === 'male' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {student.gender === 'male' ? 'Male' : 'Female'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.key!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {students.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              {selectedStudents.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Selected ({selectedStudents.size})
                </button>
              )}
              <button
                onClick={handleDeleteAll}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
                Delete All Students ({students.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}