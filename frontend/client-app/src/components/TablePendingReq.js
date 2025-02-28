import React, { useEffect, useCallback, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { IconButton, TablePagination, Collapse, Box, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Chip from '@mui/material/Chip';
import TableSortLabel from '@mui/material/TableSortLabel';
import axios from 'axios';
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";
import Tooltip from '@mui/material/Tooltip';
import Fade from "@mui/material/Fade";
import Snackbar from "@mui/material/Snackbar";
import RequestModal from "./RequestModal";
import UndoIcon from '@mui/icons-material/Undo';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate, useLocation } from "react-router-dom";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const columns = [
  { id: 'icon', name: '' },
  { id: 'request_id', name: 'Request Id', sortable: false },
  { id: 'requester_id', name: 'Requester Id', sortable: false },
  { id: 'reporting_manager', name: 'Reporting Manager', sortable: false },
  { id: 'created_at', name: 'Created Request Date', sortable: true },
  { id: 'overall_status', name: 'Overall Status', sortable: false },
];

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    color: theme.palette.common.black,
    fontFamily: 'Montserrat, sans-serif',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    fontFamily: 'Montserrat, sans-serif',
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  '&:nth-of-type(odd)': {
    border:0,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const TablePendingReq = ({ fetchWFHRequests, requestId }) => {

  const user = useSelector(selectUser);

  // Function to format the date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    };
    return new Date(dateString).toLocaleString('en-GB', options).replace(",", "");
  };

  const [openRow, setOpenRow] = React.useState({});
  const [sortConfig, setSortConfig] = React.useState({ key: '', direction: 'asc' }); //sort the created_at
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [state, setState] = React.useState({
    open: false,
    Transition: Fade,
    message: '',
  });
  const [withdrawSelectedEntries, setWithdrawSelectedEntries] = React.useState({}); //withdraw
  const [rejectSelectedEntries, setRejectSelectedEntries] = React.useState({});

  const [employeeData, setEmployeeData] = React.useState({}); // Store employee data

  const [isRejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [isWithdrawalModalOpen, setWithdrawalModalOpen] = React.useState(false);
  const [setEntries] = React.useState([...fetchWFHRequests]);
  const [loading, setLoading] = React.useState(true); // Add loading state
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [wfhCounts, setWfhCounts] = useState({})

  // Fetch employee details by staff_id
  const fetchEmployeeDetails = async (staff_id) => {
    try {
      const response = await axios.get(`https://scrumdaddybackend.studio/employees/`, {
        params: { staff_id },
      });
      if (response?.data?.data) {
        return response.data.data[0]; // Assuming the API returns an array of employees
      }
    } catch (error) {
      console.error(`Error fetching employee with staff_id ${staff_id}:`, error);
    }
    return null;
  };
  // Load employee names for all requests
  const loadEmployeeNames = async () => {
    const employeeMap = {};
    for (const request of fetchWFHRequests) {
      // Fetch the requester's name
      if (!employeeMap[request.requester_id]) {
        const requester = await fetchEmployeeDetails(request.requester_id);
        if (requester) {
          employeeMap[request.requester_id] = `${requester.staff_fname} ${requester.staff_lname}`;
        }
      }

      // Fetch the reporting manager's name
      if (!employeeMap[request.reporting_manager]) {
        const manager = await fetchEmployeeDetails(request.reporting_manager);
        if (manager) {
          employeeMap[request.reporting_manager] = `${manager.staff_fname} ${manager.staff_lname}`;
        }
      }
    }
    setEmployeeData(employeeMap); // Store employee names in state
    setLoading(false);
  };

  // Fetch employee names when the component mounts
  React.useEffect(() => {
    loadEmployeeNames();
  });

  const handleClick = (Transition, message) => () => {
    setState({
      open: true,
      Transition,
      message,
    });
  };

  const handleClose = () => {
    setState({
      ...state,
      open: false,
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);

    if(currentPath.includes("my")){
      navigate('/myRequestsPage', { replace: true });
    }
    else{
      navigate('/requestsPage', { replace: true });
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleWithdrawalClick = (request, entry) => {
    const selectedEntries = withdrawSelectedEntries[request.request_id] || [];
    const entriesToWithdraw = request.entries.filter((e) =>
      selectedEntries.includes(e.entry_id) || e.entry_id === entry.entry_id
    );
    // if (entriesToWithdraw.length > 0) {
      setWithdrawSelectedEntries((prev) => ({
        ...prev,
        [request.request_id]: entriesToWithdraw,
      }));
      setWithdrawalModalOpen(true);
    // }
  };
  
  const handleRejectClick = (request, entry) => {
    const selectedEntries = rejectSelectedEntries[request.request_id] || [];
    const entriesToReject = request.entries.filter((e) =>
      selectedEntries.includes(e.entry_id) || e.entry_id === entry.entry_id
    );
    setRejectSelectedEntries((prev) => ({
      ...prev,
      [request.request_id]: entriesToReject,
    }));
  
    // Open the rejection modal and store the current request and entry details
    setRejectModalOpen(true);
  };

  const handleToggleRow = useCallback((request_id) => {
    setOpenRow((prevOpen) => (prevOpen === request_id ? null : request_id));

    if(String(request_id) !== requestId){
      if(currentPath.includes("my")){
        navigate('/myRequestsPage', { replace: true });
      }
      else{
        navigate('/requestsPage', { replace: true });
      }
    }
  }, [requestId, currentPath, navigate]); // Include currentPath as a dependency


  useEffect(() => {
    if (requestId && fetchWFHRequests.length > 0) {
      const index = fetchWFHRequests.findIndex(request => String(request.request_id) === requestId);
      if (index !== -1) {
        const targetPage = Math.floor(index / rowsPerPage);
        setPage(targetPage); // Set to the page containing the request
        handleToggleRow(parseInt(requestId, 10)); // Convert requestId to an integer before expanding the row
      }
    }
  }, [requestId, fetchWFHRequests, rowsPerPage, handleToggleRow]);

  const handleRequestSort = (columnId) => {
    const isSortable = columns.find((col) => col.id === columnId)?.sortable;
    if (!isSortable) return;

    const isAsc = sortConfig.key === columnId && sortConfig.direction === 'asc';
    setSortConfig({ key: columnId, direction: isAsc ? 'desc' : 'asc' });
  };

  const handleCancelEntries = async (request_id, entry_id) => {
    const payload = {
      request_id: request_id,
      entry_ids: [entry_id], // Revoke only the clicked entry
    };

    try {
      // Call the API to cancel the specific entry
      await axios.put('https://scrumdaddybackend.studio/wfhRequests/cancel', payload);

      // Once the cancellation is successful, update the entry status in the local state
      fetchWFHRequests.forEach(request => {
        if (request.request_id === request_id) {
          request.entries = request.entries.map(entry => 
            entry.entry_id === entry_id ? { ...entry, status: 'Cancelled' } : entry
          );
        }
      });
  
      // Update the state to trigger re-render
      setEntries([...fetchWFHRequests]);
  
      console.log(`Entry ${entry_id} for request ${request_id} cancelled successfully.`);
      handleClick(Fade, "Cancel Successful")();
    } catch (error) {
      console.error('Error cancelling entry:', error);
      handleClick(Fade, "Cancel Failed")();
    }
  };

  const handleRejectEntries = async (formData) => {
    const validEntriesToReject = formData.entry_ids || [];
  
    const payload = {
      request_id: formData.requestId,
      entry_ids: validEntriesToReject.map((entry) => ({
        entry_id: entry.entry_id,
        reason: entry.reason,
      })),
    };
  
    console.log("Payload:", payload);
  
    try {
      // Call the API to reject the entries
      const response = await axios.put(
        "https://scrumdaddybackend.studio/wfhRequests/reject",
        payload
      );
  
      console.log("Response:", response.data);
  
      // Create a new array of requests (immutably update state)
    const updatedRequests = fetchWFHRequests.map((request) => {
      if (request.request_id === formData.requestId) {
        // Create a new array of entries with the rejection reason
        const updatedEntries = request.entries.map((entry) => {
          const rejectEntry = validEntriesToReject.find(
            (e) => e.entry_id === entry.entry_id
          );
          return rejectEntry
            ? { ...entry, status: "Rejected", rejection_reason: rejectEntry.reason } // Store the rejection reason
            : entry;
        });

        // Return the updated request object
        return { ...request, entries: updatedEntries };
      }
      return request;
    });

    console.log("Updated Requests:", updatedRequests);

    // Trigger state update with the new array reference
    setEntries(updatedRequests);
  
      // Clear rejected entries in the modal form
      setRejectSelectedEntries((prev) => ({
        ...prev,
        [formData.requestId]: [],
      }));
  
      // Check if there are any pending entries left
      const requestRejectDetails = fetchWFHRequests.find(
        (req) => req.request_id === formData.requestId
      );
      const hasPendingEntries = requestRejectDetails.entries.some(
        (entry) => entry.status === "Pending"
      );
  
      // Optionally, update overall request status if there are no pending entries
      if (!hasPendingEntries) {
        console.log(
          `Updating overall status for request ${formData.requestId} to 'Rejected'`
        );
      }
  
      // Close the reject modal
      setRejectModalOpen(false);
      handleClick(Fade, "Rejected Successful")();
    } catch (error) {
      console.error("Error rejecting entries:", error);
      handleClick(Fade, "Rejected Failed")();
    }
  };

  const handleWithdrawalEntries = async (formData) => {
    const validEntriesToWithdraw = formData.entry_ids || [];

    const payload = {
      request_id: formData.requestId,
      entry_ids: validEntriesToWithdraw.map((entry) => ({
        entry_id: entry.entry_id,
        reason: entry.reason,
      })),
    };
    console.log(payload);
    try {
      const response = await axios.put(
        "https://scrumdaddybackend.studio/wfhRequests/withdraw",
        payload
      );
      console.log("Response:", response.data);

      // Update the state for rejected entries
      fetchWFHRequests.forEach(request => {
        if (request.request_id === formData.requestId) {
          request.entries = request.entries.map(entry =>
            validEntriesToWithdraw.some(withdrawEntry => withdrawEntry.entry_id === entry.entry_id)
              ? { ...entry, status: 'Withdrawn' }
              : entry
          );
        }
      });
  
      // Trigger state update
      setEntries([...fetchWFHRequests]);

      setWithdrawSelectedEntries((prev) => ({
        ...prev,
        [formData.requestId]: [],
      }));

      const requestWithdrawDetails = fetchWFHRequests.find(
        (req) => req.request_id === formData.requestId
      );
      const hasPendingEntries = requestWithdrawDetails.entries.some(
        (entry) => entry.status === "Pending"
      );

      if (!hasPendingEntries) {
        console.log(
          `Updating overall status for request ${formData.requestId} to 'Reviewed'`
        );
      }
      handleClick(Fade, "Withdrawn Successful")();
    } catch (error) {
      console.error('Error withdrawing entries:', error);
      handleClick(Fade, "Withdrawn Failed")();
    }
  };

  const handleApproveEntry = async (request_id, entry_id) => {
    const payload = {
      request_id: request_id,
      entry_ids: [entry_id], // Revoke only the clicked entry
    };
  
    try {
      // Call the API to revoke the specific entry
      await axios.put('https://scrumdaddybackend.studio/wfhRequests/approve', payload);

      fetchWFHRequests.forEach(request => {
        if (request.request_id === request_id) {
          request.entries = request.entries.map(entry => 
            entry.entry_id === entry_id ? { ...entry, status: 'Approved' } : entry
          );
        }
      });
  
      // Update the state to trigger re-render
      setEntries([...fetchWFHRequests]);
  
      console.log(`Entry ${entry_id} for request ${request_id} approved successfully.`);
      handleClick(Fade, "Approve Successful")();
    } catch (error) {
      console.error('Error approving entry:', error);
      handleClick(Fade, "Approve Failed")();
    }
  };
  
  const handleRevokeEntry = async (request_id, entry_id) => {
    const payload = {
      request_id: request_id,
      entry_ids: [entry_id], // Revoke only the clicked entry
    };
  
    try {
      // Call the API to revoke the specific entry
      await axios.put('https://scrumdaddybackend.studio/wfhRequests/revoke', payload);

      fetchWFHRequests.forEach(request => {
        if (request.request_id === request_id) {
          request.entries = request.entries.map(entry => 
            entry.entry_id === entry_id ? { ...entry, status: 'Pending Withdrawal' } : entry
          );
        }
      });
  
      // Update the state to trigger re-render
      setEntries([...fetchWFHRequests]);
  
      console.log(`Entry ${entry_id} for request ${request_id} revoked successfully.`);
      handleClick(Fade, "Revoked Successful")();
  
      // Optionally, you can refresh the data or update the state here after the revocation
      // For example, you can clear the revoked entry from the UI or refresh the list of requests
    } catch (error) {
      console.error('Error revoking entry:', error);
      handleClick(Fade, "Revoked Failed")();
    }
  };

  const handlePendingWithdrawalEntries = async (request_id, entry_id) => {

    const payload = {
      request_id: request_id,
      entry_ids: [entry_id],
    };

    try {
      await axios.put('https://scrumdaddybackend.studio/wfhRequests/acknowledge', payload);

      fetchWFHRequests.forEach(request => {
        if (request.request_id === request_id) {
          request.entries = request.entries.map(entry => 
            entry.entry_id === entry_id ? { ...entry, status: 'Withdrawn' } : entry
          );
        }
      });
  
      // Update the state to trigger re-render
      setEntries([...fetchWFHRequests]);

      // Clear selected entries after revoking
      console.log(`Entry ${entry_id} for request ${request_id} approved successfully.`);
      handleClick(Fade, "Approve Successful")();
  
      // Optionally, you can refresh the data or update the state here after the revocation
      // For example, you can clear the revoked entry from the UI or refresh the list of requests
    } catch (error) {
      console.error('Error approving entry:', error);
      handleClick(Fade, "Approve Failed")();
    }
  };

  useEffect(() => {
    const loadAllWFHCounts = async () => {
      const counts = {};
      for (const request of fetchWFHRequests) {
        let requester = request.requester_id
        for (const entry of request.entries) {
        
          if (!counts[entry.entry_id]) {
            const count = await fetchWFHCount(requester, entry.entry_date, entry.entry_id);
            counts[entry.entry_id] = count ; // Store count or "N/A" if count is unavailable
          }
        }
      }
      setWfhCounts(counts); // Update state with counts once all are fetched
    };
  
    loadAllWFHCounts();
  }, [fetchWFHRequests]);

  const fetchWFHCount = async (staff_id, entry_date, entry_id) => {
    try {
      const response = await axios.get(
        `https://scrumdaddybackend.studio/wfhRequests/getWeeklyCount`,
        {
          params: { entry_date, staff_id },
        }
      );
      if (response.status === 200) {
        const count = response.data.count;
        setWfhCounts((prevCounts) => ({
          ...prevCounts,
          [entry_id]: count,
        }));
        return count;
      }
    } catch (error) {
      console.error("Error fetching WFH count:", error);
    }
    return null; // Return null if fetch fails
  };



  const sortedRequests = React.useMemo(() => {
    let sortedData = [...fetchWFHRequests];
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sortedData;
  }, [fetchWFHRequests, sortConfig]);

  const paginatedRequests = sortedRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div>
      {loading ? ( // Display CircularProgress while loading
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <CircularProgress />
        </Box>
      ) : (
      <TableContainer component={Paper} sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <StyledTableCell align="left" key={column.id}>
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortConfig.key === column.id}
                      direction={sortConfig.key === column.id ? sortConfig.direction : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.name}
                    </TableSortLabel>
                  ) : (
                    column.name
                  )}
                </StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRequests.map((request) => (
              <React.Fragment key={request.request_id}>
                <StyledTableRow>
                  <StyledTableCell align="left">
                    <IconButton aria-label="expand row" size="small" onClick={() => handleToggleRow(request.request_id)}>
                      {openRow === request.request_id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </StyledTableCell>
                  <StyledTableCell align="left">{request.request_id}</StyledTableCell>
                  <StyledTableCell align="left">{employeeData[request.requester_id] || request.requester_id}</StyledTableCell>
                  <StyledTableCell align="left">{employeeData[request.reporting_manager] || request.reporting_manager}</StyledTableCell>
                  <StyledTableCell align="left">{formatDate(request.created_at)}</StyledTableCell>
                  <StyledTableCell align="left">
                    <Chip
                      label={request.overall_status}
                      sx={{
                        backgroundColor:
                          request.overall_status === 'Pending'
                          ? '#f97316'
                          : request.overall_status === 'Approved'
                          ? '#065f46'
                          : request.overall_status === 'Rejected'
                          ? '#dc2626'
                          : request.overall_status === 'Cancelled'
                          ? '#be185d'
                          : request.overall_status === 'Withdrawn'
                          ? '#1e40af'
                          : request.overall_status === 'Reviewed'
                          ? '#581c87'
                          : request.overall_status === 'Pending Withdrawal'
                          ? '#854d0e'
                          : request.overall_status === 'Auto Rejected'
                          ? '#111827'
                          : 'default',
                        color: 'white',
                      }}
                    />
                  </StyledTableCell>
                </StyledTableRow>
                <TableCell colSpan={6} style={{ paddingBottom: 0, paddingTop: 0 }}>
                  <Collapse in={openRow === request.request_id} timeout="auto" unmountOnExit>
                    <Box margin={1}>
                      <Typography style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Entries for Request ID: {request.request_id}
                      </Typography>
                      <Table size="small" aria-label="entries">
                        <TableHead>
                          <StyledTableRow>
                            <StyledTableCell></StyledTableCell>
                            <StyledTableCell>Entry ID</StyledTableCell>
                            <StyledTableCell>Entry Date</StyledTableCell>
                            <StyledTableCell>Reason</StyledTableCell>
                            <StyledTableCell>Duration</StyledTableCell>
                            <StyledTableCell>Action</StyledTableCell>
                            <StyledTableCell>Status</StyledTableCell>
                          </StyledTableRow>
                        </TableHead>
                        <TableBody>
                          {request.entries.map((detail) => (
                            <>
                              {detail.status === "Pending" && (
                                <StyledTableCell colSpan={6} sx={{ padding: 2 }}>
                                  <Box display="flex" alignItems="center">
                                    <InfoOutlinedIcon sx={{ marginRight: 1, color: 'text.secondary' }} />
                                    <Typography variant="subtitle1">
                                      WFH taken for {detail.entry_date} week is: {wfhCounts?.[detail.entry_id] ?? "Loading..."}
                                    </Typography>
                                  </Box>
                                </StyledTableCell>
                              )}

                              <StyledTableRow key={detail.entry_id}>
                                <StyledTableCell align="center">
                                </StyledTableCell>
                                <StyledTableCell>{detail.entry_id}</StyledTableCell>
                                <StyledTableCell>{detail.entry_date}</StyledTableCell>
                                <StyledTableCell>{detail.reason}</StyledTableCell>
                                <StyledTableCell>{detail.duration}</StyledTableCell>
                                <StyledTableCell>
                                {detail.status === "Pending" && //for pending req for managers to approve and reject
                                    request.reporting_manager ===
                                    user.staff_id && (
                                      <>
                                      <Tooltip title="Approve" arrow>
                                        <IconButton
                                          onClick={() => handleApproveEntry(request.request_id, detail.entry_id)}
                                          style={{ marginRight: 8, cursor: 'pointer' }} // Add spacing between buttons
                                        >
                                          <DoneIcon />
                                        </IconButton>
                                      </Tooltip>
                                    
                                      <Tooltip title="Reject" arrow>
                                        <IconButton
                                          onClick={() => handleRejectClick(request, detail)} // Pass the request and entry details
                                          style={{ marginLeft: 8 }}
                                        >
                                          <CloseIcon />
                                        </IconButton>
                                      </Tooltip>
                                      {isRejectModalOpen && (
                                        <RequestModal
                                          title="Reject Entries"
                                          selectedEntries={rejectSelectedEntries[request.request_id]} // Pass the selected entries for the request
                                          open={isRejectModalOpen}
                                          onClose={() => setRejectModalOpen(false)} // Close the modal
                                          handleSubmit={handleRejectEntries} // Backend update on submission
                                        />
                                      )}
                                    </>
                                  )}
                                {detail.status === 'Approved' && 
                                request.requester_id === user.staff_id &&
                                (
                                    <Tooltip title="Revoke" arrow>
                                      <IconButton
                                        onClick={() => handleRevokeEntry(request.request_id, detail.entry_id)}
                                        >
                                        <UndoIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                
                                {detail.status === 'Approved' && request.requester_id !== user.staff_id && request.reporting_manager === user.staff_id && (
                                    <>
                                    <Tooltip title="Withdraw" arrow>
                                      <IconButton 
                                        onClick={() => handleWithdrawalClick(request, detail)} // Pass the request and entry details
                                      >
                                        <SystemUpdateAltIcon />
                                      </IconButton>
                                    </Tooltip>
                                    {isWithdrawalModalOpen &&
                                      withdrawSelectedEntries[request.request_id]
                                        ?.length > 0 && (
                                        <RequestModal
                                          title="Withdraw Request"
                                          selectedEntries={
                                            withdrawSelectedEntries[request.request_id]
                                          }
                                          open={isWithdrawalModalOpen}
                                          onClose={() => setWithdrawalModalOpen(false)}
                                          handleSubmit={handleWithdrawalEntries}
                                        />
                                      )}
                                      </>
                                    )}
                                
                                {detail.status === 'Pending' && 
                                      request.requester_id === user.staff_id && ( //those pending status where the requestor want to retract it
                                        <Tooltip title="Cancel" arrow> 
                                          <IconButton onClick={() => handleCancelEntries(request.request_id, detail.entry_id)}>
                                            <DeleteForeverIcon></DeleteForeverIcon>
                                          </IconButton>
                                        </Tooltip> 
                                    )}
                                {(detail.status === 'Pending Withdrawal' && 
                                  request.reporting_manager === user.staff_id)  && ( 
                                    //those pending withdrawal status and the reporting manager is the login user
                                    <Tooltip title="Approve" arrow>
                                      <IconButton onClick={() => handlePendingWithdrawalEntries(request.request_id, detail.entry_id)}>
                                        <DoneIcon></DoneIcon>
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  {(detail.status === 'Withdrawn' || detail.status === 'Rejected' || detail.status === 'Cancelled' || detail.status === 'Auto Rejected') && (
                                    <Typography variant="body2">DONE</Typography>
                                  )}
                                </StyledTableCell>
                                <StyledTableCell>
                                      {/* <Chip
                                        label={detail.status}
                                        sx={{
                                          backgroundColor:
                                          detail.status === 'Pending'
                                          ? '#f97316'
                                          : detail.status === 'Approved'
                                          ? '#065f46'
                                          : detail.status === 'Rejected'
                                          ? '#dc2626'
                                          : detail.status === 'Cancelled'
                                          ? '#be185d'
                                          : detail.status === 'Withdrawn'
                                          ? '#1e40af'
                                          : detail.status === 'Reviewed'
                                          ? '#581c87'
                                          : detail.status === 'Pending Withdrawal'
                                          ? '#854d0e'
                                          : detail.status === 'Auto Rejected'
                                          ? '#111827'
                                          : 'default',
                                        color: 'white',
                                        }}
                                      /> */}
                                  {(detail.action_reason || detail.status === 'Auto Rejected') ? (
                                    <Tooltip title={detail.action_reason || 'System has auto rejected your request due to exceeding the 24-hour working period for approval'} arrow>
                                          <Chip
                                            label={detail.status}
                                            sx={{
                                              backgroundColor:
                                                detail.status === 'Pending' ? '#f97316' :
                                                detail.status === 'Approved' ? '#065f46' :
                                                detail.status === 'Rejected' ? '#dc2626' :
                                                detail.status === 'Cancelled' ? '#be185d' :
                                                detail.status === 'Withdrawn' ? '#1e40af' :
                                                detail.status === 'Reviewed' ? '#581c87' :
                                                detail.status === 'Pending Withdrawal' ? '#854d0e' :
                                                detail.status === 'Auto Rejected' ? '#111827' :
                                                'default',
                                              color: 'white',
                                            }}
                                          />
                                      </Tooltip>
                                    ) : (
                                      <Chip
                                        label={detail.status}
                                        sx={{
                                          backgroundColor:
                                            detail.status === 'Pending' ? '#f97316' :
                                            detail.status === 'Approved' ? '#065f46' :
                                            detail.status === 'Rejected' ? '#dc2626' :
                                            detail.status === 'Cancelled' ? '#be185d' :
                                            detail.status === 'Withdrawn' ? '#1e40af' :
                                            detail.status === 'Reviewed' ? '#581c87' :
                                            detail.status === 'Pending Withdrawal' ? '#854d0e' :
                                            detail.status === 'Auto Rejected' ? '#111827' :
                                            'default',
                                          color: 'white',
                                        }}
                                      />
                                    )}
                                </StyledTableCell>
                              </StyledTableRow>
                            </>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Collapse>
                </TableCell>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={fetchWFHRequests.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          '& .MuiTablePagination-selectRoot': {
            fontFamily: 'Montserrat, sans-serif', 
          },
          '& .MuiTablePagination-toolbar': {
            fontFamily: 'Montserrat, sans-serif', 
          },
          '& .MuiTablePagination-displayedRows': {
            fontFamily: 'Montserrat, sans-serif',
          },
          '& .MuiButtonBase-root': {
            fontFamily: 'Montserrat, sans-serif', 
          },
          '& .MuiTablePagination-selectLabel': {
            fontFamily: 'Montserrat, sans-serif', 
          },
          '& .MuiTablePagination-select': {
            fontFamily: 'Montserrat, sans-serif',
          },
        }}
      />
      <Snackbar
        open={state.open}
        onClose={handleClose}
        TransitionComponent={state.Transition}
        message={state.message}
        key={state.Transition.name}
        autoHideDuration={1200}
      />
    </div>
  )
};

export default TablePendingReq
