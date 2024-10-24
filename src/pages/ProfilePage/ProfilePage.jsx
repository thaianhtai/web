import React, { useState, useEffect } from 'react';


const ProfilePage = ({ setUser }) => {
  // State for user details
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [showModal, setShowModal] = useState(false); // State to manage modal visibility
  const [errorMessage, setErrorMessage] = useState('');
  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Use the token for authentication
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        // Assuming the response has the same structure as the state variables
        setUserName(data.username);
        setUserEmail(data.email);
        setUserAddress(data.address);
        setUserPhone(data.numberphone);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []); // Empty dependency array means this effect runs once when the component mounts

  const handleEditSubmit = async () => {
    // Kiểm tra số điện thoại
    if (!/^\d{10}$/.test(userPhone)) {
      setErrorMessage('Số điện thoại phải gồm 10 chữ số.'); // Cập nhật thông điệp lỗi
      return; // Dừng hàm nếu số điện thoại không hợp lệ
    }

    const updatedUserData = {
      username: userName,
      email: userEmail,
      address: userAddress,
      numberphone: userPhone
    };

    try {
      const response = await fetch('http://localhost:5000/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedUserData)
      });

      if (!response.ok) {
        throw new Error('Failed to update user data');
      }

      console.log('User data updated successfully');
      setShowModal(false); // Close the modal after submitting
      setErrorMessage(''); // Xóa thông điệp lỗi nếu thành công
    } catch (error) {
      setErrorMessage('Error updating user data: ' + error.message); // Cập nhật thông điệp lỗi
      console.error('Error updating user data:', error);
    }
  };
  
  
  const handleDeleteAccount = async () => {
    const userId = sessionStorage.getItem('userId'); // Ensure this is set properly
    console.log("User ID:", userId);

    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xoá tài khoản này không?");
    if (!confirmDelete || !userId) return; // Check if userId is not null

    try {
        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete user account');
        }

        
       
        window.location.href = '/'; // Redirect to home or login page
        setUser(null);
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userId')
     
    } catch (error) {
        console.error('Error deleting user account:', error);
        alert(`Error: ${error.message}`); // Display error message to the user
    }
};

  return (
    <div className="container mt-5 mb-3">
      <div className="row">
        <div className="col-lg-4">
          {/* User Avatar Info */}
          <div className="card">
            <img
              src="https://media.istockphoto.com/id/1131164548/vector/avatar-5.jpg?s=612x612&w=0&k=20&c=CK49ShLJwDxE4kiroCR42kimTuuhvuo2FH5y_6aSgEo="
              className="card-img-top" alt="User Avatar" />
            <div className="card-body text-center">
              <h4>{userName}</h4>
              <p className="text-muted">{userEmail}</p>
              <span className="badge badge-success">Hoạt Động</span>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {/* Detailed Info */}
          <div className="card">
            <div className="card-header">
              <h3>Thông Tin Chi Tiết</h3>
            </div>
            <div className="card-body">
              <p>
                <strong>Tên Người Dùng:</strong> <span>{userName}</span>
              </p>
              <p>
                <strong>Email:</strong> <span>{userEmail}</span>
              </p>
              <p>
                <strong>Địa chỉ:</strong> <span>{userAddress}</span>
              </p>
              <p>
                <strong>Số điện thoại:</strong> <span>{userPhone}</span>
              </p>
              <p>
                <strong>Trạng Thái:</strong> <span>Hoạt Động</span>
              </p>
            </div>
            <div className="card-footer">
              <button 
                className="btn btn-primary me-2" 
                onClick={() => setShowModal(true)}>
                Chỉnh Sửa
              </button>
              <button 
                className="btn btn-warning" 
                onClick={handleDeleteAccount}>
                Xoá Tài khoản
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Chỉnh Sửa Thông Tin Người Dùng</h5>
                  <button type="button" className="close" onClick={() => setShowModal(false)}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form>
                  {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>} {/* Hiển thị thông điệp lỗi */}
                    <div className="mb-3">
                      <label htmlFor="editUserName" className="form-label">Tên Người Dùng</label>
                      <input
                        type="text"
                        className="form-control"
                        id="editUserName"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)} // Update state on input change
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="editUserEmail" className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        id="editUserEmail"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)} // Update state on input change
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="editUserAddress" className="form-label">Địa Chỉ</label>
                      <input
                        type="text"
                        className="form-control"
                        id="editUserAddress"
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)} // Update state on input change
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="editUserPhone" className="form-label">Số Điện Thoại</label>
                      <input
                        type="text"
                        className="form-control"
                        id="editUserPhone"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)} // Update state on input change
                      />
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Đóng</button>
                  <button type="button" className="btn btn-primary" onClick={handleEditSubmit}>Lưu Thay Đổi</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div> {/* Backdrop for the modal */}
        </>
      )}
    </div>
  );
};

export default ProfilePage;
