import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "../redux/userSlice";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  Slide,
  Snackbar,
} from "@mui/material";
import axios from "axios";

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

const LoginComponent = () => {
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  // Function to authenticate employee
  const authenticateEmployee = async (staffId) => {
    try {
      const response = await axios.get(
        `https://scrumdaddybackend.studio/employees/auth`,
        {
          params: { staff_id: staffId },
        }
      );

      if (response.data.status_code === 200) {
        console.log(response.data.data);
        return response.data.data;
      } else {
        console.error("Employee not found:", response.data.message);
        return null;
      }
    } catch (error) {
      console.error(
        "Error fetching staff:",
        error.response ? error.response.data : error.message
      );
      return null;
    }
  };

  // Function to fetch employee from backend
  const fetchEmployee = async (staffId) => {
    try {
      const response = await axios.get(
        `https://scrumdaddybackend.studio/employees/`,
        {
          params: { staff_id: staffId, dept: "" },
        }
      );
      console.log(response.data.data[0]);
      return response.data.data[0];
    } catch (error) {
      console.error("Error fetching staff:", error);
      return null;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!staffId) {
      setError("Please enter a staff ID.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      const authenticate = await authenticateEmployee(staffId);

      const foundUser = await fetchEmployee(parseInt(staffId));
      console.log("Found user response:", foundUser);

      if (foundUser && authenticate) {
        if (parseInt(password) === authenticate) {
          const userInfo = foundUser;
          setSnackbarMessage("Successfully Logged In");
          setSnackbarSeverity("success");
          setOpenSnackbar(true);
          dispatch(login(userInfo));
          setError("");
          setStaffId("");
          setPassword("");
        } else {
          setError("Invalid Password. Please try again.");
        }
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setSnackbarMessage("Successfully Logged Out");
    setSnackbarSeverity("success");
    setOpenSnackbar(true);
    // alert("Successfully Logged Out.");
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="sm" className="flex justify-center pt-16">
      <Box
        sx={{
          mt: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {user.isLoggedIn ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" gutterBottom>
              Welcome, {user.userInfo.Staff_ID}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Box sx={{ width: "100%" }}>
            <Typography variant="h5" gutterBottom>
              Staff Login
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Staff ID"
                variant="outlined"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="Enter your Staff ID"
                sx={{ mb: 2 }}
                type="number"
              />
              <TextField
                fullWidth
                type="password"
                label="Password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Password"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleLogin}
                type="submit"
              >
                Login
              </Button>
            </form>
          </Box>
        )}
      </Box>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={SlideTransition}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LoginComponent;
