"use client";
import { useEffect, useState } from "react";
import Web3 from "web3";
import ABI from "../SmartContracts/MobilePhones.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [spinner, setSpinner] = useState({
    isConnecting: false,
    isAdding: false,
    isFetching: false,
  });
  const [addPhoneForm, setAddPhoneForm] = useState({
    modelNumber: "",
    imei1: "",
    imei2: "",
  });
  const [fetchPhoneDetail, setFetchPhoneDetail] = useState({
    imei: "",
    data: {
      modelNumber: "",
      imei2: "",
      owner: "",
    },
  });
  const [txModal, setTxModal] = useState({ isVisible: false, txHash: "" });

  useEffect(() => {
    // To Detect Metamask
    const { ethereum } = window || null;
    const detectWallet = async () => {
      if (!ethereum) {
        alert("Install Wallet Extension to Connect");
      } else {
        //To get the connected wallet address
        const accounts = await ethereum.request({ method: "eth_accounts" });
        setCurrentAccount(accounts[0]);
      }
    };

    // Handling Account Changing
    ethereum.on("accountsChanged", handleAccountsChanged);

    // eth_accounts always returns an array.
    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts.
        alert("Please connect to MetaMask.");
      } else if (accounts[0] !== currentAccount) {
        setCurrentAccount(accounts[0]);
      }
    }

    detectWallet();
  }, []);

  const handleAddPhoneChange = (e) => {
    setAddPhoneForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleGetPhoneChange = (e) => {
    setFetchPhoneDetail((prev) => ({ ...prev, imei: e.target.value }));
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      transition: "Bounce",
    });
  };

  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      transition: "Bounce",
    });
  };

  const showModal = (hash) => {
    setTxModal({ isVisible: true, txHash: hash });
  };
  const closeModal = () => {
    setTxModal({ isVisible: false, txHash: "" });
  };
  const connectWallet = async () => {
    try {
      setSpinner((prev) => ({
        ...prev,
        isConnecting: true,
      }));
      const { ethereum } = window || null;
      if (!ethereum) {
        alert("Install Wallet Extension to Connect");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);

      // Switching to Sepolia Chain
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], //Each blockchain has a unique chain id like for ethereum it is 0x00
      });
    } catch (err) {
      alert("Error while connecting..!");
    } finally {
      setSpinner((prev) => ({
        ...prev,
        isConnecting: false,
      }));
    }
  };

  const AddPhone = async (e) => {
    e.preventDefault();
    const numberRegex = /^\d+$/;

    if (
      !numberRegex.test(addPhoneForm.imei1) ||
      !numberRegex.test(addPhoneForm.imei2)
    ) {
      showErrorToast("IMEI Can only be numeric");
      return;
    }

    setSpinner((prev) => ({
      ...prev,
      isAdding: true,
    }));

    try {
      const { ethereum } = window || {};
      if (!ethereum) {
        alert("Install Wallet Extension to Connect");
        return;
      }

      const web3 = new Web3(ethereum);
      const contract = new web3.eth.Contract(
        ABI.abi,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      );
      const txHash = await contract.methods
        .addPhone(
          addPhoneForm.modelNumber,
          Number(addPhoneForm.imei1),
          Number(addPhoneForm.imei2)
        )
        .send({ from: currentAccount });
      showModal(txHash.transactionHash);

      setAddPhoneForm({
        imei1: "",
        imei2: "",
        modelNumber: "",
      });
      showSuccessToast("Transaction Successfull");
      setSpinner((prev) => ({
        ...prev,
        isAdding: false,
      }));
    } catch (err) {
      setSpinner((prev) => ({
        ...prev,
        isAdding: false,
      }));
      switch (err.code) {
        case 4001:
          alert("");
      }
    }
  };

  const GetPhone = async (e) => {
    e.preventDefault();
    setSpinner((prev) => ({
      ...prev,
      isFetching: true,
    }));
    try {
      const { ethereum } = window || {};
      if (!ethereum) {
        alert("Install Wallet Extension to Connect");
        return;
      }

      const web3 = new Web3(ethereum);
      const contract = new web3.eth.Contract(
        ABI.abi,
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      );

      const mobileDetail = await contract.methods
        .getPhoneDetails(fetchPhoneDetail.imei)
        .call({ from: currentAccount });

      setFetchPhoneDetail({
        imei: "",
        data: {
          modelNumber: mobileDetail[0],
          imei2: mobileDetail[2],
          owner: mobileDetail[3],
        },
      });
      setSpinner((prev) => ({
        ...prev,
        isFetching: false,
      }));
    } catch (err) {
      setSpinner((prev) => ({
        ...prev,
        isFetching: false,
      }));
      switch (err.code) {
        case 4001:
          alert("");
      }
    }
  };

  return (
    <main className="flex min-h-screen justify-center p-5">
      {/* React Toastify */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {txModal.isVisible && (
        <div className="absolute  z-50 flex bg-black bg-opacity-35 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
          <div className="relative   p-4 w-full max-w-2xl max-h-full">
            {/* Modal content */}
            <div className="relative  w-full bg-white rounded-lg shadow dark:bg-gray-700">
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Transaction Details
                </h3>
                <button
                  onClick={closeModal}
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <svg
                    className="w-3 h-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              {/* Modal body */}
              <div className="p-4 md:p-5 space-y-4">
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  Transaction has been{" "}
                  <span className="text-green-500">Success</span>
                </p>

                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  Block has been mined at : {txModal.txHash}
                </p>
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  Go and verify it on :{" "}
                  <a
                    className="underline text-blue-500"
                    href="https://sepolia.etherscan.io/"
                  >
                    sepolia.etherscan.io
                  </a>
                </p>
              </div>
              {/* Modal footer */}
              <div className="flex items-center justify-end p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                <button
                  onClick={closeModal}
                  type="button"
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">
        {currentAccount && (
          <div className="mb-2 justify-center gap-1 md:justify-start items-center  flex flex-wrap">
            Wallet Connected:{" "}
            <b className="text-xs md:text-md w-52 overflow-scroll md:overflow-hidden md:w-full">
              {" "}
              {currentAccount}
            </b>
          </div>
        )}
        {/* Connect Wallet button */}
        <button
          className="border w-52 flex justify-center border-black rounded p-2 hover:bg-yellow-700"
          onClick={connectWallet}
        >
          {!spinner.isConnecting && "Connect Wallet"}
          {spinner.isConnecting && (
            <div role="status">
              <svg
                aria-hidden="true"
                className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          )}
        </button>

        <div className="flex flex-wrap w-full gap-2 ">
          {/* Get Phone Contract  */}
          <div className="relative mt-1  flex flex-col text-gray-700 bg-transparent shadow-none rounded-xl bg-clip-border">
            <h4 className="block font-sans text-2xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
              Get Mobile Phone Details
            </h4>
            <p className="block mt-1 font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
              Nice to meet you! Enter mobile imei1 to get.
            </p>
            <form onSubmit={GetPhone} className=" mt-8 mb-2  sm:w-96">
              <div className="flex flex-col gap-6 mb-1">
                <h6 className="block -mb-3 font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-blue-gray-900">
                  IMEI
                </h6>
                <div className="relative h-11 w-full min-w-[200px]">
                  <input
                    placeholder="WW-XXXXXX-YYYYYY-Z"
                    type="text"
                    className="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent !border-t-blue-gray-200 bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:!border-t-gray-900 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
                    name={"imei"}
                    onChange={handleGetPhoneChange}
                    value={fetchPhoneDetail.imei}
                  />
                  <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all before:content-none after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all after:content-none peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"></label>
                </div>
              </div>

              <button
                className="mt-6 flex justify-center  w-full select-none rounded-lg bg-gray-900 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                type="submit"
              >
                {!spinner.isFetching && "Get"}
                {spinner.isFetching && (
                  <div role="status">
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                    <span className="sr-only">Loading...</span>
                  </div>
                )}
              </button>
            </form>

            {fetchPhoneDetail.data.imei2.length !== 0 && (
              <div className="bg-green-600 border rounded p-3  border-gray-500">
                <h4 className="block font-sans  antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                  Model Number: {fetchPhoneDetail.data.modelNumber}
                </h4>
                <h4 className="block font-sans  antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                  IMEI2: {String(fetchPhoneDetail.data.imei2)}
                </h4>
                <h4 className="block font-sans  antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                  Owner:{" "}
                  {fetchPhoneDetail.data.owner?.slice(0, 15) +
                    "...." +
                    fetchPhoneDetail.data.owner?.slice(-10) ||
                    "No owner data available"}
                </h4>
              </div>
            )}
          </div>

          {/* Add Phone Form */}
          <div className="relative mt-1  flex flex-col text-gray-700 bg-transparent shadow-none rounded-xl bg-clip-border">
            <h4 className="block font-sans text-2xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
              Registering Mobile Phone
            </h4>
            <p className="block mt-1 font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
              Nice to meet you! Enter mobile details to register.
            </p>
            <form onSubmit={AddPhone} className=" mt-8 mb-2  sm:w-96">
              <div className="flex flex-col gap-6 mb-1">
                <h6 className="block -mb-3 font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-blue-gray-900">
                  Model Number
                </h6>
                <div className="relative h-11 w-full min-w-[200px]">
                  <input
                    placeholder="Enter mobile model"
                    name="modelNumber"
                    className="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent !border-t-blue-gray-200 bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:!border-t-gray-900 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
                    onChange={handleAddPhoneChange}
                    maxLength={20}
                    value={addPhoneForm.modelNumber}
                  />
                  <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all before:content-none after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all after:content-none peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"></label>
                </div>
                <h6 className="block -mb-3 font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-blue-gray-900">
                  IMEI1
                </h6>
                <div className="relative h-11 w-full min-w-[200px]">
                  <input
                    placeholder="WW-XXXXXX-YYYYYY-Z"
                    type="text"
                    className="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent !border-t-blue-gray-200 bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:!border-t-gray-900 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
                    name={"imei1"}
                    onChange={handleAddPhoneChange}
                    maxLength={14}
                    minLength={14}
                    value={addPhoneForm.imei1}
                  />
                  <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all before:content-none after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all after:content-none peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"></label>
                </div>
                <h6 className="block -mb-3 font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-blue-gray-900">
                  IMEI2
                </h6>
                <div className="relative h-11 w-full min-w-[200px]">
                  <input
                    placeholder="WW-XXXXXX-YYYYYY-Z"
                    type="text"
                    className="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent !border-t-blue-gray-200 bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:!border-t-gray-900 focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
                    name={"imei2"}
                    onChange={handleAddPhoneChange}
                    maxLength={14}
                    minLength={14}
                    value={addPhoneForm.imei2}
                  />
                  <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all before:content-none after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all after:content-none peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"></label>
                </div>
              </div>

              <button
                className="mt-6 flex justify-center  w-full select-none rounded-lg bg-gray-900 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                type="submit"
              >
                {!spinner.isAdding && "Add"}
                {spinner.isAdding && (
                  <div role="status">
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                    <span className="sr-only">Loading...</span>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
