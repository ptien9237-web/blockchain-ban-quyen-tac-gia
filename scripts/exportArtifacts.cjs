const fs = require("fs");
const path = require("path");

async function exportArtifacts() {
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/BookCopyrightRegistry.sol/BookCopyrightRegistry.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("Artifact not found! Run 'npx hardhat compile' first.");
    process.exit(1);
  }

  const raw = fs.readFileSync(artifactPath, "utf-8");
  const artifact = JSON.parse(raw);

  const contractInfo = {
    contractName: artifact.contractName,
    sourceName: artifact.sourceName,
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    exportedAt: new Date().toISOString(),
  };

  // Directories to export to
  const targetDirs = [
    path.join(__dirname, "../server/contracts"),
    path.join(__dirname, "../src/contracts"),
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Export JSON
    fs.writeFileSync(
      path.join(dir, "BookCopyrightRegistry.json"),
      JSON.stringify(contractInfo, null, 2)
    );

    // Export TS module
    const tsContent = `// Auto-generated ABI and Contract Metadata for BookCopyrightRegistry
export const BookCopyrightRegistryAbi = ${JSON.stringify(artifact.abi, null, 2)} as const;

export const BOOK_COPYRIGHT_REGISTRY_METADATA = {
  contractName: ${JSON.stringify(artifact.contractName)},
  sourceName: ${JSON.stringify(artifact.sourceName)},
  exportedAt: ${JSON.stringify(contractInfo.exportedAt)},
} as const;
`;

    fs.writeFileSync(path.join(dir, "BookCopyrightRegistry.ts"), tsContent);
  }

  console.log("Exported BookCopyrightRegistry ABI and metadata to server/contracts and src/contracts.");
}

exportArtifacts().catch((err) => {
  console.error(err);
  process.exit(1);
});
