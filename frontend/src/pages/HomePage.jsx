import { Link } from 'react-router-dom'
import { Brain, Shield, Award, TrendingUp, Bitcoin, BookOpen } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master <span className="text-orange-500">Bitcoin</span> & <span className="text-purple-600">Blockchain</span> with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Personalized learning paths powered by AI, earn verified certificates on Stacks blockchain,
            and join a community of blockchain enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/courses"
              className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Explore Courses
            </Link>
            <Link
              to="/register"
              className="border border-orange-500 text-orange-500 px-8 py-3 rounded-lg hover:bg-orange-50 transition-colors font-semibold"
            >
              Start Learning
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-100 rounded-2xl">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose BitEdu?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Personalization</h3>
              <p className="text-gray-600">
                Our AI adapts to your learning style, pace, and knowledge gaps to create the perfect learning experience.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Blockchain Certificates</h3>
              <p className="text-gray-600">
                Earn tamper-proof certificates on the Stacks blockchain that verify your expertise to employers worldwide.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress Analytics</h3>
              <p className="text-gray-600">
                Track your learning journey with detailed analytics and get insights to optimize your study approach.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Learning Paths
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <Bitcoin className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Bitcoin Fundamentals</h3>
              <p className="text-gray-600 mb-4">
                Master the basics of Bitcoin, from digital signatures to the Lightning Network.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Beginner</span>
                <span className="text-sm font-semibold text-orange-500">20 hours</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <BookOpen className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Stacks Development</h3>
              <p className="text-gray-600 mb-4">
                Learn Clarity smart contract development and build on Bitcoin's security.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Intermediate</span>
                <span className="text-sm font-semibold text-purple-600">35 hours</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <Award className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">DeFi Mastery</h3>
              <p className="text-gray-600 mb-4">
                Understand decentralized finance protocols, yield farming, and liquidity provision.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Advanced</span>
                <span className="text-sm font-semibold text-green-600">40 hours</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Link
              to="/courses"
              className="inline-flex items-center bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              View All Courses
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl text-white">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Start Your Blockchain Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of learners mastering Bitcoin and blockchain technology with personalized AI guidance.
          </p>
          <Link
            to="/register"
            className="bg-white text-orange-500 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold inline-flex items-center space-x-2"
          >
            <span>Get Started Free</span>
          </Link>
        </div>
      </section>
    </div>
  )
}