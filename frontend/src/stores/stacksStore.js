import { create } from 'zustand'
import { AppConfig, UserSession, showConnect } from '@stacks/connect'

const appConfig = new AppConfig(['store_write', 'publish_data'])

export const useStacksStore = create((set, get) => ({
  userSession: null,
  isConnected: false,
  stacksAddress: null,
  publicKey: null,
  isLoading: false,
  error: null,

  initializeStacks: () => {
    const userSession = new UserSession({ appConfig })
    set({ userSession })
    
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData()
      set({
        isConnected: true,
        stacksAddress: userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet,
        publicKey: userData.publicKey
      })
    }
  },

  connectWallet: () => {
    const { userSession } = get()
    
    showConnect({
      appDetails: {
        name: 'BitEdu',
        icon: window.location.origin + '/bitcoin.svg',
      },
      redirectTo: '/',
      onFinish: () => {
        const userData = userSession.loadUserData()
        set({
          isConnected: true,
          stacksAddress: userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet,
          publicKey: userData.publicKey,
          error: null
        })
      },
      onCancel: () => {
        set({ error: 'Wallet connection cancelled' })
      },
      userSession
    })
  },

  disconnectWallet: () => {
    const { userSession } = get()
    userSession.signUserOut()
    set({
      isConnected: false,
      stacksAddress: null,
      publicKey: null,
      error: null
    })
  },

  signMessage: async (message) => {
    const { userSession } = get()
    if (!userSession.isUserSignedIn()) {
      throw new Error('User not signed in')
    }

    try {
      set({ isLoading: true })
      // Implementation would use Stacks.js to sign message
      const signature = 'mock-signature' // Replace with actual signing
      set({ isLoading: false })
      return signature
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  sendTransaction: async (txOptions) => {
    const { userSession } = get()
    if (!userSession.isUserSignedIn()) {
      throw new Error('User not signed in')
    }

    try {
      set({ isLoading: true })
      // Implementation would broadcast transaction
      const txId = 'mock-tx-id' // Replace with actual transaction
      set({ isLoading: false })
      return txId
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  }
}))