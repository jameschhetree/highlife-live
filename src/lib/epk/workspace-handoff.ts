import { slugifyEpkValue } from "@/lib/epk/constants";

const WORKSPACE_ROOT =
  "/Users/dokworkmakk/Documents/Website Things HLL/EPK Generator Workspace";

export function buildEpkWorkspaceHandoff(input: {
  artistName: string;
  artistSlug?: string;
  jobId: string;
}) {
  const artistSlug = slugifyEpkValue(input.artistSlug || input.artistName);
  const artistRelativeRoot = `artists/${artistSlug}`;
  const requestFilename = `epk-build-request-${input.jobId}.txt`;

  return {
    artistSlug,
    threadName: `EPK | ${input.artistName}`,
    requestFilename,
    requestRelativePath: `${artistRelativeRoot}/input/${requestFilename}`,
    inputPath: `${WORKSPACE_ROOT}/${artistRelativeRoot}/input`,
    assetsPath: `${WORKSPACE_ROOT}/${artistRelativeRoot}/input/assets`,
    mediaPath: `${WORKSPACE_ROOT}/${artistRelativeRoot}/media`,
    outputPath: `${WORKSPACE_ROOT}/${artistRelativeRoot}/output`,
    command: `Reload the EPK workspace instructions. Build the single EPK_BUILD_REQUEST_V1 under ${artistRelativeRoot}/input using only files listed under that artist's input/assets or approved files under its media folder. Update the artist tracking files and write the generated package under ${artistRelativeRoot}/output. Do not read Codex attachments.`,
  };
}
