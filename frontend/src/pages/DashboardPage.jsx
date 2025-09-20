import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Trophy, Clock, Target, Flame, BookOpen, Award } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard')
      return response.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  const stats = dashboardData?.user || {}
  const progress = dashboardData?.progress || {}

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Continue your blockchain learning journey
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">Level {stats.level}</div>
            <div className="text-sm text-gray-500">{stats.totalPoints} points</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Study Streak</p>
              <p className="text-2xl font-bold text-orange-500">{stats.streakDays} days</p>
            </div>
            <Flame className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Courses Enrolled</p>
              <p className="text-2xl font-bold text-blue-600">{progress.coursesEnrolled}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-600">{progress.coursesCompleted}</p>
            </div>
            <Trophy className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Study Time</p>
              <p className="text-2xl font-bold text-purple-600">{Math.floor((stats.totalStudyTime || 0) / 60)}h</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Weekly Progress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={progress.weeklyProgress || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            {dashboardData?.achievements?.recent?.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Award className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="font-medium">{achievement.title}</p>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No achievements yet. Start learning to earn your first badge!</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Recommended for You</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardData?.recommendations?.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-500">{rec.title}</h4>
              <p className="text-gray-600 text-sm mt-1">{rec.reason}</p>
              <button className="mt-3 text-orange-500 hover:text-orange-600 text-sm font-medium">
                Start Learning →
              </button>
            </div>
          )) || (
            <p className="text-gray-500 col-span-2 text-center py-4">
              Complete your learning profile to get personalized recommendations!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}