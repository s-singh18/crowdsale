import { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { ethers } from "ethers";

const Whitelist = ({ provider, whitelist }) => {
  const [address, setAddress] = useState("");
  console.log(whitelist);

  const handleSubmit = async (e, action) => {
    e.preventDefault();
    if (ethers.utils.isAddress(address) === false) return;
    if (action === "addAddress") {
      await whitelist.addUser(address);
      console.log(`Added Address: ${address}`);
    } else if (action === "removeAddress") {
      await whitelist.removeUser(address);
      console.log(`Removed Address: ${address}`);
    }
  };

  return (
    <Row className="justify-content-center">
      <Col md={6}>
        <Form onSubmit={(e) => handleSubmit(e, "addAddress")}>
          <Form.Group controlId="formInput">
            <Form.Label>Whitelist Form</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Add Account
          </Button>{" "}
          <Button
            variant="secondary"
            type="submit"
            onClick={(e) => handleSubmit(e, "removeAddress")}
          >
            Remove Account
          </Button>{" "}
        </Form>
      </Col>
    </Row>
  );
};

export default Whitelist;
