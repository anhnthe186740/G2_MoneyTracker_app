import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
export default function Dashboard() {

  const navigate = useNavigate();
  const { user } = useContext(AuthContext)!;
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {/* Nội dung dashboard sẽ được thêm ở đây */}
          <button 
              onClick={() => navigate('/profile')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-md flex items-center gap-2"
            >
     Thông tin cá nhân
            </button>
    </div>
  );
}