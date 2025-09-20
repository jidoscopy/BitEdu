import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useStacksStore } from '../../stores/stacksStore'
import { Bitcoin, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { isConnected, connectWallet, disconnectWallet, stacksAddress } = useStacksStore()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    disconnectWallet()
    navigate('/')
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Bitcoin className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-900">BitEdu</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/courses" className="text-gray-700 hover:text-orange-500 transition-colors">
              Courses
            </Link>
            <Link to="/leaderboard" className="text-gray-700 hover:text-orange-500 transition-colors">
              Leaderboard
            </Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-orange-500 transition-colors">
                  Dashboard
                </Link>
                <Link to="/certificates" className="text-gray-700 hover:text-orange-500 transition-colors">
                  Certificates
                </Link>
                
                <div className="flex items-center space-x-4">
                  {isConnected ? (
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      {formatAddress(stacksAddress)}
                    </span>
                  ) : (
                    <button
                      onClick={connectWallet}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                    >
                      Connect Wallet
                    </button>
                  )}
                  
                  <div className="relative group">
                    <button className="flex items-center space-x-2 text-gray-700 hover:text-orange-500">
                      <User className="h-5 w-5" />
                      <span>{user.firstName}</span>
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-orange-500 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link to="/courses" className="text-gray-700 hover:text-orange-500">
                Courses
              </Link>
              <Link to="/leaderboard" className="text-gray-700 hover:text-orange-500">
                Leaderboard
              </Link>
              
              {user ? (
                <>
                  <Link to="/dashboard" className="text-gray-700 hover:text-orange-500">
                    Dashboard
                  </Link>
                  <Link to="/certificates" className="text-gray-700 hover:text-orange-500">
                    Certificates
                  </Link>
                  <Link to="/profile" className="text-gray-700 hover:text-orange-500">
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-gray-700 hover:text-orange-500"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-orange-500">
                    Login
                  </Link>
                  <Link to="/register" className="text-gray-700 hover:text-orange-500">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}