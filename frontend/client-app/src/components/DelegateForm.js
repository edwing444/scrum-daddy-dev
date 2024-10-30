import axios from "axios";
import React, { useState, useEffect } from "react";
import {
  TextField,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Slide,
  Card,
  Snackbar,
  CardContent,
  MenuItem,
  Alert,
  FormControl,
} from "@mui/material";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

const DelegateModal = ({ open, onClose }) => {
  const user = useSelector(selectUser);
  const department = user.dept;

  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    delegate_to: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [eligibleManagers, setEligibleManagers] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
  };

  useEffect(() => {
    const loadEligibleManagers = async () => {
      const fetchAllEligibleManagers = async (dept) => {
        try {
          const response = await axios.get(
            `https://scrumdaddybackend.studio/employees/reporting-mgr`,
            { params: { dept } }
          );

          const eligibleManagers = await Promise.all(
            response.data.data
              .filter((manager) => manager.staff_id !== user.staff_id)
              .map(async (manager) => {
                const isNotOnLeave = await checkManagersNotOnLeave(
                  manager.staff_id,
                  formData.start_date,
                  formData.end_date
                );
                return isNotOnLeave ? manager : null;
              })
          );

          const availableManagers = eligibleManagers.filter((m) => m !== null);

          if (availableManagers.length === 0) {
            setSnackbarMessage(
              "There are no managers available on selected dates, please try again."
            );
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
          }

          setEligibleManagers(availableManagers);
        } catch (error) {
          console.error("Error fetching eligible managers:", error);
          setSnackbarMessage("Failed to fetch eligible managers.");
          setSnackbarSeverity("error");
          setOpenSnackbar(true);
        }
      };

      if (open && formData.start_date && formData.end_date && user) {
        await fetchAllEligibleManagers(department);
      }
    };

    loadEligibleManagers();
  }, [open, department, formData.start_date, formData.end_date, user]);

  const checkNoCurrentDelegateRequests = async (
    staffId,
    startDate,
    endDate
  ) => {
    try {
      const response = await axios.get(
        `https://scrumdaddybackend.studio/employees/delegate`,
        { params: { staffId } }
      );

      const existingDelegations = response.data.data;

      const isOverlapping = existingDelegations.some((delegation) => {
        const delegationStart = dayjs(delegation.start_date);
        const delegationEnd = dayjs(delegation.end_date);
        const selectedStart = dayjs(startDate);
        const selectedEnd = dayjs(endDate);

        return (
          selectedStart.isBetween(delegationStart, delegationEnd, null, "[]") ||
          selectedEnd.isBetween(delegationStart, delegationEnd, null, "[]") ||
          delegationStart.isBetween(selectedStart, selectedEnd, null, "[]") ||
          delegationEnd.isBetween(selectedStart, selectedEnd, null, "[]")
        );
      });

      return !isOverlapping;
    } catch (error) {
      console.error("Error checking existing delegation requests:", error);
      return false;
    }
  };

  const checkManagersNotOnLeave = async (staffId, startDate, endDate) => {
    try {
      const response = await axios.get(
        `https://scrumdaddybackend.studio/leaves/staff/${staffId}`
      );

      const leaveData = response.data.data;
      console.log("Leaves", leaveData);

      const isOnLeave = leaveData.some((leave) => {
        const leaveStart = dayjs(leave.start_date);
        const leaveEnd = dayjs(leave.end_date);
        const selectedStart = dayjs(startDate);
        const selectedEnd = dayjs(endDate);

        return (
          selectedStart.isBetween(leaveStart, leaveEnd, null, "[]") ||
          selectedEnd.isBetween(leaveStart, leaveEnd, null, "[]") ||
          leaveStart.isBetween(selectedStart, selectedEnd, null, "[]") ||
          leaveEnd.isBetween(selectedStart, selectedEnd, null, "[]")
        );
      });

      return !isOnLeave; // Return true if not on leave
    } catch (error) {
      console.error("Error checking manager leave dates:", error);
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    validateField(name, value);
  };

  const validateField = (field, value) => {
    let newErrors = { ...errors };
    const startDate = dayjs(formData.start_date);
    const endDate = dayjs(formData.end_date);
    const today = dayjs();

    const getNextWorkingDay = (date) => {
      const dayOfWeek = date.day();
      if (dayOfWeek === 5) return date.add(3, "day"); // If Friday, add 3 days (to Monday)
      return date.add(1, "day"); // Else add 1 day
    };

    const nextWorkingDay = getNextWorkingDay(today);

    const validations = {
      reason: () => {
        newErrors.reason = value ? "" : "Reason cannot be blank";
      },
      delegate_to: () => {
        newErrors.delegate_to = value
          ? ""
          : "Delegate selection cannot be blank";
      },
      start_date: () => {
        if (!value) {
          newErrors.start_date = "Start date must be selected";
        } else if (startDate.day() === 0 || startDate.day() === 6) {
          newErrors.start_date = "Delegation cannot start on weekends";
        } else if (startDate.isBefore(nextWorkingDay, "day")) {
          newErrors.start_date =
            "Start date must be at least one working day in advance";
        } else {
          newErrors.start_date = "";
        }
      },
      end_date: () => {
        if (!value) {
          newErrors.end_date = "End date must be selected";
        } else if (endDate.day() === 0 || endDate.day() === 6) {
          newErrors.end_date = "Delegation cannot start on weekends";
        } else if (endDate.isBefore(startDate)) {
          newErrors.end_date = "End date must be after start date";
        } else {
          newErrors.end_date = "";
        }
      },
    };

    if (validations[field]) {
      validations[field]();
    }

    setErrors(newErrors);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    validateField("delegate_to", formData.delegate_to);
    validateField("start_date", formData.start_date);
    validateField("end_date", formData.end_date);
    validateField("reason", formData.reason);

    if (errors.delegate_to || errors.dates || errors.reason) {
      setSnackbarMessage("Please resolve the errors before submitting.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    const { delegate_to, start_date, end_date, reason } = formData;
    if (!delegate_to || !start_date || !end_date || !reason) {
      setSnackbarMessage("Please fill in all required fields.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    const isNoOverlappingRequests = await checkNoCurrentDelegateRequests(
      user.staff_id,
      start_date,
      end_date
    );

    if (!isNoOverlappingRequests) {
      setSnackbarMessage(
        "You already have an existing delegation for these dates."
      );
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    const formattedStartDate = dayjs(formData.start_date).format(
      "YYYY-MM-DDTHH:mm:ss"
    );
    const formattedEndDate = dayjs(formData.end_date)
      .endOf("day")
      .format("YYYY-MM-DDTHH:mm:ss");

    const payload = {
      delegate_from: user.staff_id,
      delegate_to: delegate_to,
      status: "pending",
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      reason: reason,
      department: user.dept,
      notification_status: "pending",
    };
    console.log("Payload:", payload);

    try {
      const response = await axios.post(
        `https://scrumdaddybackend.studio/employees/delegate`,
        payload
      );
      console.log(response.data);
      setSnackbarMessage("Delegation submitted successfully.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      onClose();
    } catch (error) {
      console.error("Error submitting delegation:", error);
      setSnackbarMessage("Failed to submit delegation.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Delegate WFH Rights</DialogTitle>
      <DialogContent>
        <Card sx={{ maxWidth: 800, margin: "auto" }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                  error={!!errors?.start_date}
                  helperText={errors?.start_date || ""}
                  inputProps={{
                    min: new Date().toISOString().split("T")[0],
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="End Date"
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                  error={!!errors?.end_date}
                  helperText={errors?.end_date || ""}
                  inputProps={{
                    min: new Date().toISOString().split("T")[0],
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    label="Delegate To"
                    select
                    value={formData.delegate_to}
                    onChange={handleInputChange}
                    name="delegate_to"
                    required
                    error={!!errors?.delegate_to}
                    disabled={eligibleManagers.length === 0}
                  >
                    {eligibleManagers.map((manager) => (
                      <MenuItem key={manager.staff_id} value={manager.staff_id}>
                        {manager.staff_fname} {manager.staff_lname}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  required
                  error={!!errors?.reason}
                  helperText={errors?.reason || ""}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleFormSubmit} variant="contained" color="primary">
          Submit
        </Button>
      </DialogActions>

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
    </Dialog>
  );
};

export default DelegateModal;
