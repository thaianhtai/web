import React, { useState } from 'react';
// Giả định rằng bạn có hàm addUser trong userService để thêm người dùng vào cơ sở dữ liệu.
import { addUser } from './userService';

function AdminPage() {
  const [users, setUsers] = useState([]);

  const handleAddUser = async (event) => {
    event.preventDefault();

    const newUser = {
      username: document.getElementById('username').value,
      email: document.getElementById('email').value,
      address: document.getElementById('address').value || '',
      phone: document.getElementById('phone').value,
      role: document.getElementById('role').value,
    };

    await addUser(newUser); // Gọi API thêm người dùng
    setUsers([...users, newUser]); // Cập nhật lại danh sách người dùng

    // Reset form và đóng modal
    document.getElementById('addUserForm').reset();
    const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
    addUserModal.hide();
  };