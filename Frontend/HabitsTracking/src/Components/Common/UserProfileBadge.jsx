import React from 'react';

/*
  UserProfileBadge
  Props:
    user: { name, email, profilePicture }
    size: 'sm' | 'md'
    showEmail: boolean
*/
const UserProfileBadge = ({ user = {}, size = 'md', showEmail = true, className = '' }) => {
  const { name = '', email = '', profilePicture = null } = user;
  const initial = (name || email || 'U').charAt(0).toUpperCase();
  const avatarSize = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base';

  return (
    <div className={`flex items-center gap-3 ${className}`}>      
      {profilePicture ? (
        <img
          src={profilePicture}
            alt="Profile"
            className={`${avatarSize} rounded-full object-cover border-2 border-blue-400`}
        />
      ) : (
        <div className={`${avatarSize} rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold border-2 border-blue-400 shadow-inner`}>{initial}</div>
      )}
      <div className="flex flex-col leading-tight">
        <span className="text-white font-semibold text-sm truncate max-w-[140px]">{name || (email ? email.split('@')[0] : 'User')}</span>
        {showEmail && email && <span className="text-slate-400 text-xs truncate max-w-[160px]">{email}</span>}
      </div>
    </div>
  );
};

export default UserProfileBadge;
