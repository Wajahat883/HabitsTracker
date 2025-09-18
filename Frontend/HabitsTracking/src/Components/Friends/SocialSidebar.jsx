import React, { useState } from 'react';
import { Users, Search, UserPlus, Heart } from 'lucide-react';
import UserDiscoverySidebar from './UserDiscoverySidebar';
import FriendsManager from './FriendsManager';
import FriendNotifications from './FriendNotifications';

const SocialSidebar = () => {
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      {/* Social Actions Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Social Hub
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Discover Users Button */}
          <button
            onClick={() => openModal('discover')}
            className="flex items-center gap-3 w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all group"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Search className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Discover People</h4>
              <p className="text-sm text-gray-500">Find and connect with new friends</p>
            </div>
          </button>

          {/* Friends Manager Button */}
          <button
            onClick={() => openModal('friends')}
            className="flex items-center gap-3 w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-all group"
          >
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">My Friends</h4>
              <p className="text-sm text-gray-500">Manage your connections</p>
            </div>
          </button>

          {/* Friend Requests Notification */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserPlus className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Friend Requests</h4>
                <p className="text-sm text-gray-500">Pending notifications</p>
              </div>
            </div>
            <FriendNotifications />
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserDiscoverySidebar
        isOpen={activeModal === 'discover'}
        onClose={closeModal}
      />

      <FriendsManager
        isOpen={activeModal === 'friends'}
        onClose={closeModal}
        activeTab="friends"
      />
    </>
  );
};

export default SocialSidebar;