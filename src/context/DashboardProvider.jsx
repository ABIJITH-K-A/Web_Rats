import { useState } from "react";
import { DashboardContext } from "./DashboardContext";

export const DashboardProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
