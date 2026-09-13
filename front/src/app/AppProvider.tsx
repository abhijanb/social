import { store } from "./store";
import { Provider } from "react-redux";

export default function AppProvider({ children }: { children: React.ReactNode }) {
  // Implementation for the app provider
  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}