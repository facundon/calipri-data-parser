const colors = {
  baseFont: "#484538",
  dark: "#131112",
  white: "#fcfcfc",
  primary: "#f9db6d",
  primaryDark: "#ecb45f",
  secondary: "#48ada9",
  secondaryDark: "#36827f",
  error: "#d13b23",
}

export const ReaderStyle = {
  dropArea: {
    borderColor: colors.secondary,
    borderRadius: 20,
    width: "350px",
    alignSelf: "center",
    height: "100%",
  },
  dropAreaActive: {
    borderColor: colors.error,
  },
  dropFile: {
    width: 250,
    height: 120,
    background: colors.secondaryDark,
    zIndex: -1,
  },
  fileSizeInfo: {
    color: colors.baseFont,
    backgroundColor: colors.white,
    borderRadius: 3,
    lineHeight: 1,
    marginBottom: "0.5em",
    padding: "0 0.4em",
  },
  fileNameInfo: {
    color: colors.primaryDark,
    backgroundColor: colors.baseFont,
    borderRadius: 3,
    fontSize: 14,
    lineHeight: 1,
    padding: "0.4em",
  },
  removeButton: {
    color: colors.error,
  },
  progressBar: {
    backgroundColor: colors.primary,
  },
}
