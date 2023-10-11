import Web3 from 'web3';
import React, { useState, useEffect } from 'react';
import contract from './contract';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Paper,
  Typography,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import './App.css';

function App() {
  const [status, setStatus] = useState(false);
  const [gameResult, setGameResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState('');
  const [roundData, setRoundData] = useState(null);
  const [isIdResultVisible, setIsIdResultVisible] = useState(true);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const formatNumberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  const [searchedRoundData, setSearchedRoundData] = useState(null);
  const [searchFightNo, setSearchFightNo] = useState('');
  const [idGame, setIdGame] = useState('');
  const [betAmount, setBetAmount] = useState('');





  useEffect(() => {
    window.ethereum.on('chainChanged', (chainId) => {
      if (chainId !== '0x6703b') { // 421613 in hexadecimal is 6703b
        toast.warning('Please connect to Goerli Arb Testnet');
      }
    });
  }, []);

  const fetchCurrentRound = async () => {
    try {
      const result = await contract.currentRound.call();
      setCurrentRound(result.toString());
    } catch (error) {
      console.error('Error fetching currentRound:', error);
    }
  };

  useEffect(() => {
    fetchCurrentRound();
  }, []);

  const fetchFightDetails = async (fightNo) => {
    try {
      const result = await contract.rounds(fightNo);
      const convertToEth = (value) => {
        const ethValue = Web3.utils.fromWei(value.toString(), 'ether');
        return formatNumberWithCommas(ethValue);
      };

      const fightDetails = {
        idGame: result[0].toString(),
        totalAmountBet: convertToEth(result[2]),
        RedAmount: convertToEth(result[3]),
        BlueAmount: convertToEth(result[4]),
        oddsAmount: result[5].toString(),
        gameStatus: result[6],
        gameResult: result[7].toString(),
      };

      setSearchedRoundData(fightDetails);
    } catch (error) {
      console.error('Error fetching fight details:', error);
    }
  };



  useEffect(() => {
    const intervalId = setInterval(fetchCurrentRound, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchRoundsData = async () => {
      try {
        const result = await contract.rounds(currentRound);
        if (result && result.length >= 8) {
          const convertToEth = (value) => {
            const ethValue = Web3.utils.fromWei(value.toString(), 'ether');
            return formatNumberWithCommas(ethValue);
          };


          const roundData = {
            idGame: result[0].toString(),
            totalAmountBet: convertToEth(result[2]),
            RedAmount: convertToEth(result[3]),
            BlueAmount: convertToEth(result[4]),
            oddsAmount: result[5].toString(),
            gameStatus: result[6],
            gameResult: result[7].toString(),
          };
          setRoundData(roundData);
        } else {
          console.error('Invalid data received from contract.');
        }
      } catch (error) {
        console.error('Error fetching round data:', error);
      }
    };

    fetchRoundsData();
    handleHideIdResult();
  }, [currentRound]);


  async function setBettableStatus() {
    try {
      setLoading(true);
      const transaction = await contract._setBettableStatus(status);
      // Add the transaction to the history
      setTransactionHistory([...transactionHistory, `Set Bettable Status: ${status}`]);
      console.log(transaction);
      toast.success('Status Updated Successfully!');
    } catch (error) {
      console.log(error);
      toast.error('Status Update Failed!');
    } finally {
      setLoading(false);
    }
  }

  async function executeRound() {
    try {
      setLoading(true);
      const transaction = await contract.executeRound(gameResult, currentRound);
      // Add the transaction to the history
      setTransactionHistory([...transactionHistory, `Declared Winner: ${gameResult}`]);
      console.log(transaction);
      toast.success('Winner Declared Successfully!');
    } catch (error) {
      console.log(error);
      toast.error('Winner Declaration Failed, Game Still Open!');
    } finally {
      setLoading(false);
    }
  }

  async function BetRed(amount, idGame) {
    try {
      setLoading(true);
      const transaction = await contract.betRed(idGame, amount, {
        from: window.ethereum.selectedAddress,
    });
      setTransactionHistory([...transactionHistory, `BetRed: ${amount} for Game: ${idGame}`]);
      console.log(transaction);
      toast.success('Bet on Red Successful!');
    } catch (error) {
      toast.error('Failed to Bet on Red!');
    } finally {
      setLoading(false);
    }
  }

  async function BetBlue(amount, idGame) {
    try {
      setLoading(true);
      const transaction = await contract.betBlue(idGame, amount, {
        from: window.ethereum.selectedAddress,
    });
    
      setTransactionHistory([...transactionHistory, `BetBlue: ${amount} for Game: ${idGame}`]);
      console.log(transaction);
      toast.success('Bet on Blue Successful!');
    } catch (error) {
      toast.error('Failed to Bet on Blue!');
    } finally {
      setLoading(false);
    }
  }

  const handleAmountChange = (value) => {
    // Convert ether to wei
    const weiValue = Web3.utils.toWei(value.toString(), 'ether');

    // Set state with wei value
    setBetAmount(weiValue);
}



  async function genesisStartRound() {
    try {
      setLoading(true);
      const transaction = await contract.genesisStartRound();
      // Add the transaction to the history
      setTransactionHistory([...transactionHistory, 'Genesis Round Started']);
      console.log(transaction);
      toast.success('Genesis Round Started Successfully!');
    } catch (error) {
      console.log(error);
      toast.error('Failed to Start Genesis Round!');
    } finally {
      setLoading(false);
    }
  }

  const handleHideIdResult = () => {
    setIsIdResultVisible(false);
  };

  // Function to fetch transaction history
  const fetchTransactionHistory = async (contractAddress) => {
    try {
      const apiKey = 'UGIK4GVW1VRPNTX36IY4T7DMQJF5PP76SE'; // Make sure this is your API key
      const apiUrl = `https://api-testnet.polygonscan.com/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;


      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === '1' && data.result.length > 0) {
        const transactions = data.result.map((tx) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
        }));
        setTransactionHistory(transactions);
      } else {
        console.error('Error fetching transaction history:', data.message);
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }
  };

  useEffect(() => {
    if (roundData) {
      fetchTransactionHistory('0x41c3eB04fE81aE149B868F3645dA03a8b3Bed9FC'); // Fetch transaction history when roundData is available
    }
  }, [roundData]);


  return (
    <Container maxWidth="md" className="app-container">
    <Typography variant="h4" className="app-heading">
        COCK FIGHT BETTING
    </Typography>

    <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
            <Paper className="bet-card">
                <Typography variant="h6" className="card-title">CURRENT FIGHT DETAILS</Typography>
                {roundData ? (
                    <>
                        <Typography>FIGHT NO.: <strong>{roundData.idGame}</strong></Typography>
                        <Typography>TOTAL BET: <strong>{roundData.totalAmountBet}</strong></Typography>
                        <Typography>TOTAL BET RED: <strong>{roundData.RedAmount}</strong></Typography>
                        <Typography>TOTAL BET WHITE: <strong>{roundData.BlueAmount}</strong></Typography>
                        <Typography>ODDS: <strong>{roundData.oddsAmount}</strong></Typography>
                        <Typography>FIGHT STATUS: {roundData.gameStatus ? 'OPEN' : 'CLOSED'}</Typography>
                        <Typography>FIGHT RESULT: {roundData.gameResult}</Typography>
                    </>
                ) : <Typography>Loading...</Typography>}
            </Paper>

            <Paper className="bet-card">
                <Typography variant="h6" className="card-title">OPEN/CLOSE BETS</Typography>
                <FormControlLabel
                    control={<Checkbox checked={status} onChange={(e) => setStatus(e.target.checked)} />}
                    label="Status"
                />
                <Button variant="contained" color="primary" onClick={setBettableStatus} disabled={loading}>
                    Set Status
                </Button>
            </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
            <Paper className="bet-card">
                <Typography variant="h6" className="card-title">CURRENT FIGHT NO.</Typography>
                <Typography textAlign={'center'} variant="h5">{currentRound}</Typography>

                {roundData && (
                    <>
                        <Typography variant="h6" className="card-title">CURRENT FIGHT STATUS</Typography>
                        <Typography textAlign={'center'}>{roundData.gameStatus ? 'OPEN' : 'CLOSED'}</Typography>
                    </>
                )}

                <Typography variant="h6" className="card-title">DECLARE WINNER</Typography>
                <TextField
                    label="Game Result (0 = RED, 1 = BLUE, 2 = DRAW)"
                    value={gameResult}
                    onChange={(e) => setGameResult(e.target.value)}
                    fullWidth
                    style={{ marginBottom: '10px' }}
                />
                {isIdResultVisible && (
                    <TextField
                        label="id"
                        value={currentRound}
                        fullWidth
                        style={{ marginBottom: '10px' }}
                        disabled
                    />
                )}
                <div>
                  <Button variant="contained" color="primary" onClick={executeRound} disabled={loading}>
                    DECLARE
                </Button>
                </div>
                
            </Paper>

            <Paper className="bet-card">
                <Typography variant="h6" className="card-title">Genesis Start Round</Typography>
                <Button variant="contained" color="primary" onClick={genesisStartRound} disabled={loading}>
                    Genesis Start Round
                </Button>
            </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
            <Paper className="bet-card">
                <Typography variant="h6" className="card-title">SEARCH FIGHT</Typography>
                <TextField
                    label="Enter Fight No."
                    value={searchFightNo}
                    onChange={(e) => setSearchFightNo(e.target.value)}
                    fullWidth
                    style={{ marginBottom: '10px' }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        if (searchFightNo) fetchFightDetails(searchFightNo);
                    }}
                    disabled={loading || !searchFightNo}
                >
                    SEARCH
                </Button>

                {/* Display searched fight details if available */}
                {searchedRoundData && (
                    <>
                        <Typography variant="h6" className="card-title">SEARCHED FIGHT DETAILS</Typography>
                        <Typography>FIGHT NO.: <strong>{searchedRoundData.idGame}</strong></Typography>
                        <Typography>TOTAL BET: <strong>{searchedRoundData.totalAmountBet}</strong></Typography>
                        <Typography>TOTAL BET RED: <strong>{searchedRoundData.RedAmount}</strong></Typography>
                        <Typography>TOTAL BET WHITE: <strong>{searchedRoundData.BlueAmount}</strong></Typography>
                        <Typography>ODDS: <strong>{searchedRoundData.oddsAmount}</strong></Typography>
                        <Typography>FIGHT STATUS: {searchedRoundData.gameStatus ? 'OPEN' : 'CLOSED'}</Typography>
                        <Typography>FIGHT RESULT: {searchedRoundData.gameResult}</Typography>
                    </>
                )}
            </Paper>

            <Paper className="bet-card">
                <Typography variant="h6" className="card-title">PLACE BET</Typography>
                <TextField
                    label="Enter Game ID"
                    value={idGame}
                    onChange={(e) => setIdGame(e.target.value)}
                    fullWidth
                    style={{ marginBottom: '10px' }}
                />
                <TextField
                    label="Enter Amount (in ether)"
                    value={betAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    fullWidth
                    style={{ marginBottom: '10px' }}
                />

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => BetRed(betAmount, idGame)}
                    disabled={loading}
                >
                    BET RED
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => BetBlue(betAmount, idGame)}
                    disabled={loading}
                    style={{ marginLeft: '10px' }}
                >
                    BET BLUE
                </Button>
            </Paper>
        </Grid>
    </Grid>

    {/* Display transaction history if available */}
    {transactionHistory.length > 0 && (
        <Paper className="bet-card">
            <Typography variant="h6" className="card-title">Transaction History</Typography>
            <List>
                {transactionHistory.map((transaction, index) => (
                    <ListItem key={index}>
                        <ListItemText
                            primary={`Transaction ${index + 1}`}
                            secondary={
                                <React.Fragment>
                                    <Typography component="span" variant="body2" color="textPrimary">
                                        Hash: {transaction.hash}
                                    </Typography>
                                    <Typography component="span" variant="body2" color="textPrimary">
                                        From: {transaction.from}
                                    </Typography>
                                    <Typography component="span" variant="body2" color="textPrimary">
                                        To: {transaction.to}
                                    </Typography>
                                    <Typography component="span" variant="body2" color="textPrimary">
                                        Value: {transaction.value}
                                    </Typography>
                                </React.Fragment>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    )}

    <div className="app-section">
        {loading && <CircularProgress />}
    </div>
    <ToastContainer />
</Container>

  );
}

export default App;



