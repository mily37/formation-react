import { create, StateCreator } from "zustand"
import { createJSONStorage, devtools, persist } from "zustand/middleware"
import authLogger from "./authLogger"
import customSessionStorage from "./storageAuth"
import AuthService from "../services/AuthService"
import useShopStore from "./shopStore"
import useProductStore from "./productStore"


interface Address {
    firstline: string,
    postcode: string
    city: string
}

interface User {
    id: number,
    firstname: string,
    lastname: string,
    email: string
    address?: Address
}

interface AuthState {
    isAuthenticated: boolean,
    token?: string,
    user?: User,
}

interface AuthActions{
    login: (email: string, password: string) => Promise<void>,
    logout: () => void,
}

const authStore: StateCreator<AuthState & AuthActions, [["zustand/devtools", never]]> = (set, get) => ({
    isAuthenticated: false,
    token: undefined,
    user: undefined,
    login: async (email: string, password: string) => {
        try {
            const { user, token} = await AuthService.loginFromApi(email, password);
            set({token, user, isAuthenticated: true}, false, "authStore/login")
            useShopStore.getState().setMessage({
                messageText: `Bienvenue ${user?.firstname}`,
                type: "info"
            })
        } catch (error) {
            set({token: undefined, user: undefined, isAuthenticated: false})
            useShopStore.getState().setMessage({
                messageText: `Login error : ${error}`,
                type: "error"
            })
        }
    },
    logout: () => {
        set({token: undefined, user: undefined, isAuthenticated: false}, false, "authStore/logout")
        useShopStore.getState().setMessage({
            messageText: "Disconnection successful",
            type: "info"
        })
        // Vider le panier
        useProductStore.getState().resetCart();
        set({token: undefined, user:undefined, isAuthenticated: false})

        useShopStore.getState().setMessage({
            messageText: "Disconnection succesful",
            type: "info"
        });
    },
})



const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        authLogger(
            devtools(authStore)
        ),
        {
            name: 'auth-storage', // unique name
            storage: createJSONStorage(() => customSessionStorage),
            // onRehydrateStorage: (state) => {
            //   console.log('hydration starts')
            //   return (state, error) => {
            //     if (error) {
            //       console.log('hydration error:', error)
            //     } else {
            //       console.log('hydration finished')
            //     }
            //   }
            // }
          },
    )
);

export default useAuthStore;