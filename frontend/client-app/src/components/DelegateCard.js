import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Collapse,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

const IndividualDelegateCard = ({
  record,
  delegatorName,
  expandedCardId,
  handleExpandClick,
  changeDelegateStatus,
}) => {
  const formattedStartDate = new Date(record.start_date).toLocaleDateString();
  const formattedEndDate = new Date(record.end_date).toLocaleDateString();

  return (
    <Card sx={{ minWidth: 250, padding: "0" }} variant="outlined">
      <CardContent className="flex flex-row justify-between">
        <p className="text-xs">Request by: {delegatorName}</p>
        <CardActions disableSpacing sx={{ padding: "0" }}>
          <Button
            size="small"
            onClick={() => handleExpandClick(record.delegate_id)}
            endIcon={
              expandedCardId === record.delegate_id ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )
            }
          ></Button>
        </CardActions>
      </CardContent>

      <Collapse
        in={expandedCardId === record.delegate_id}
        timeout="auto"
        unmountOnExit
      >
        <CardContent>
          <div>Reason: {record.reason}</div>
          <div>
            {formattedStartDate} - {formattedEndDate}
          </div>
          <div>Status: {record.status}</div>
          <div>
            {record.status !== "accepted" && record.status !== "rejected" && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() =>
                    changeDelegateStatus(
                      record.delegate_id,
                      record.delegate_from,
                      record.delegate_to,
                      "accepted"
                    )
                  }
                  sx={{ marginRight: "8px" }}
                >
                  Accept
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() =>
                    changeDelegateStatus(
                      record.delegate_id,
                      record.delegate_from,
                      record.delegate_to,
                      "rejected"
                    )
                  }
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default IndividualDelegateCard;
