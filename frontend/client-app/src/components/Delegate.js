import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";
import IndividualDelegateCard from "./DelegateCard";
import { Snackbar, Slide, Alert, Card } from "@mui/material";

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

const DelegateCardPage = () => {
  const user = useSelector(selectUser);
  const staffId = user.staff_id;

  const [delegateData, setDelegateData] = useState([]);
  const [delegatorNames, setDelegatorNames] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [expandedCardId, setExpandedCardId] = useState(null);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const fetchDelegatorNames = useCallback(async (data) => {
    const names = {};
    
    await Promise.all(
      data.map(async (record) => {
        if (record.delegate_id) {
          try {
            const response = await axios.get(
              `https://scrumdaddybackend.studio/employees/`,
              {
                params: { staff_id: record.delegate_from, dept: "" },
              }
            );

            if (response.data && response.data.data) {
              const { staff_fname, staff_lname, staff_id } = response.data.data[0];
              names[record.delegate_id] = staff_id === staffId ? "Me" : `${staff_fname} ${staff_lname}`;
            }
          } catch (error) {
            console.error(`Error fetching name for delegate_id ${record.delegate_id}:`, error);
          }
        }
      })
    );
    
    setDelegatorNames(names);
  }, [staffId]); // Include staffId in dependencies

  useEffect(() => {
    if (delegateData.length > 0) {
      fetchDelegatorNames(delegateData);
    }
  }, [delegateData, fetchDelegatorNames]); // Add fetchDelegatorNames to dependencies


  const fetchDelegateByStaffId = async (staffId) => {
    try {
      const response = await axios.get(
        "https://scrumdaddybackend.studio/employees/delegate",
        { params: { staffId } }
      );
      if (response.data.status_code === 200) {
        setDelegateData(response.data.data);
      } else {
        setDelegateData([]);
        console.error("No records found or error fetching records.");
      }
    } catch (error) {
      console.error("Error fetching delegate records", error);
    }
  };

  const changeDelegateStatus = async (
    delegate_id,
    delegate_from,
    delegate_to,
    status
  ) => {
    try {
      const response = await axios.post(
        `https://scrumdaddybackend.studio/employees/delegate-status-history`,
        { delegate_id, delegate_from, delegate_to, status }
      );

      console.log(response);
      if (response.data.status_code === 200) {
        fetchDelegateByStaffId(staffId);
        setSnackbarMessage("Submitted successfully");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Error updating status");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    fetchDelegateByStaffId(staffId);

    const intervalId = setInterval(() => {
      fetchDelegateByStaffId(staffId);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [staffId]);

  const handleExpandClick = (cardId) => {
    setExpandedCardId(expandedCardId === cardId ? null : cardId);
  };

  return (
    <Card sx={{ minWidth: 250, borderRadius: "12px" }} variant="none">
      <p gutterBottom className="pl-3 font-bold text-md text-blue-900">
        Delegation Requests
      </p>
      {delegateData.length > 0 ? (
        delegateData.map((record) => (
          <>
            {record.status === "accepted" && (
              <Card>
                <div>{record.reason}</div>
              </Card>
            )}
            {record.status !== "accepted" && (
              <IndividualDelegateCard
                key={record.delegate_id}
                record={record}
                delegatorName={delegatorNames[record.delegate_id]}
                expandedCardId={expandedCardId}
                handleExpandClick={handleExpandClick}
                changeDelegateStatus={changeDelegateStatus}
              />
            )}
          </>
        ))
      ) : (
        <Card variant="body2" color="textSecondary">
          You have no delegation requests.
        </Card>
      )}
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
    </Card>
  );
};

export default DelegateCardPage;
