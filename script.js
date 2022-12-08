/******************************
 * ChatGPT Messages Downloader
 ******************************
 *
 * Author: João Pedro <joaopiacillo@outlook.com.br>
 * Version: 2.0.0
 */

// It is important that this script runs inside an annonymous function so it's
// variables and functions don't affect the global scope.
(function () {
    // Blocks the script from running on any other website rather than CGPT's one.
    if (!/chat\.openai\.com\/.*/.test(location.href))
        return alert(
            "Oh oh. Sorry but this script can only be executed in ChatGPT: https://chat.openai.com/chat"
        );

    const FILE_TYPES = ["Text", "JSON", "CSV"];

    const INTERFACE_ID = "chat-gpt-messages-downloader-interface";

    // Blocks the script from running if an instance of the script is still being executed.
    if (document.getElementById(INTERFACE_ID)) return;

    function setMultipleInObject(properties, object) {
        for (let property in properties) {
            var value = properties[property];
            object[property] = value;
        }
        return object;
    }

    /*** INTERFACE ***/

    /* Creates the default interface options window on the bottom right side. */
    function createInterface() {
        var interfaceElement = document.createElement("div");
        interfaceElement.id = INTERFACE_ID;
        setMultipleInObject(
            {
                position: "absolute",
                right: "30px",
                bottom: "0",
                height: "100%",
                maxHeight: "320px",
                minHeight: "320px",
                width: "100%",
                maxWidth: "335px",
                backgroundColor: "#202123",
                borderRadius: "10px 10px 0 0",
                overflow: "hidden",
            },
            interfaceElement.style
        );

        /*** Title Bar ****/

        var titlebar = document.createElement("div");
        setMultipleInObject(
            {
                width: "100%",
                height: "48px",
                backgroundColor: "#343541",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
                boxShadow: "0 4px 4px rgba(0 0 0 / 25%)",
            },
            titlebar.style
        );

        var title = document.createElement("p");
        title.textContent = "Download Messages";
        title.style.marginLeft = "15px";

        var closeButton = document.createElement("button");
        closeButton.textContent = "X";
        setMultipleInObject(
            {
                width: "48px",
                height: "48px",
                backgroundColor: "#444654",
                display: "grid",
                placeItems: "center",
            },
            closeButton.style
        );

        // Once clicked, the interface is removed from the DOM.
        closeButton.addEventListener("click", () => interfaceElement.remove());

        titlebar.append(title, closeButton);

        /*** Options ***/
        function createSelectBox(options) {
            var select = document.createElement("select");
            setMultipleInObject(
                {
                    paddingLeft: "15px",
                    fontWeight: "normal",
                    fontSize: "16px",
                    backgroundColor: "#444654",
                    boxShadow: "0 4px 4px rgba(0 0 0 / 25%)",
                    border: "none",
                    borderRadius: "10px",
                },
                select.style
            );

            function createSelectOption(content) {
                var option = document.createElement("option");
                option.textContent = content;
                return option;
            }

            // Creates an <option> element for each text option provided.
            var optionElements = options.map((option) =>
                createSelectOption(option)
            );
            select.append(...optionElements);

            return select;
        }

        function createOptionElement(labelText, options) {
            var option = document.createElement("div");
            setMultipleInObject(
                {
                    display: "flex",
                    paddingRight: "15px",
                    paddingLeft: "15px",
                    alignItems: "center",
                    color: "white",
                },
                option.style
            );

            var label = document.createElement("span");
            label.textContent = labelText;
            setMultipleInObject(
                {
                    fontWeight: "bold",
                    fontSize: "16px",
                    width: "90px",
                },
                label.style
            );

            var select = createSelectBox(options);
            select.style.flex = "1";

            option.append(label, select);
            return option;
        }

        var optionsContainer = document.createElement("div");
        optionsContainer.style.paddingTop = "15px";
        optionsContainer.style.marginBottom = "30px";

        var fileTypeOption = createOptionElement("File Type", FILE_TYPES);
        fileTypeOption.style.marginBottom = "30px";

        var targetsOption = createOptionElement("Targets", [
            "User + AI",
            "User",
            "AI",
        ]);

        optionsContainer.append(fileTypeOption, targetsOption);

        /*** Buttons ***/
        function createButton(content) {
            var button = document.createElement("button");
            button.textContent = content;
            setMultipleInObject(
                {
                    width: "137px",
                    backgroundColor: "#343541",
                    border: "solid 2px #444654",
                    fontSize: "14px",
                    fontWeight: "bold",
                    boxShadow: "0 4px 4px rgba(0 0 0 / 25%)",
                    padding: "5px",
                    color: "white",
                    borderRadius: "10px",
                },
                button.style
            );

            return button;
        }

        var buttonsContainer = document.createElement("div");
        setMultipleInObject(
            {
                display: "flex",
                justifyContent: "space-between",
                paddingLeft: "15px",
                paddingRight: "15px",
            },
            buttonsContainer.style
        );

        function callFunctionWithFileTypeAndTarget(func) {
            func(
                fileTypeOption.children[1].value,
                targetsOption.children[1].value
            );
        }

        var downloadButton = createButton("Download");
        downloadButton.addEventListener("click", () =>
            callFunctionWithFileTypeAndTarget(downloadMessages)
        );

        var copyButton = createButton("Copy to Clipboard");
        copyButton.addEventListener("click", () =>
            callFunctionWithFileTypeAndTarget(copyMessages)
        );

        buttonsContainer.append(downloadButton, copyButton);

        interfaceElement.append(titlebar, optionsContainer, buttonsContainer);
        return interfaceElement;
    }

    /*** MESSAGES FETCH ***/
    function fetchMessages(target) {
        // This query was created by Chrome's "Copy Selector" option from the Inspect window.
        const msgListElement = document.querySelector(
            "#__next > div > div.flex.flex-1.flex-col.md\\:pl-52.h-full > main > div.flex-1.overflow-hidden > div > div > div"
        );

        const msgsList = [...msgListElement.children];
        // We pop the array since the msg list has an empty div for interface spacing at it's end.
        msgsList.pop();

        var msgsDump = [];

        for (let i = 0; i < msgsList.length; i++) {
            var msgElement = msgsList[i];

            const content = msgElement.querySelector(
                "div > div:nth-child(2) > div"
            ).textContent;

            const profile_pic_div =
                msgElement.children[0].firstChild.firstChild;
            // The AI profile picture element has way more class names compared
            // to the user's image.
            const is_ai_msg = profile_pic_div.classList.length > 2;

            const sender = is_ai_msg ? "AI" : "User";

            // Only the target messages will be dumped.
            if (!target.includes(sender)) continue;

            msgsDump.push({
                index: i,
                sender: sender,
                content: content,
            });
        }

        return msgsDump;
    }

    /*** CONVERSIONS ***/
    function msgObjectToText(msgs) {
        return msgs
            .map(({ sender, content }) => `${sender}: ${content}`)
            .join("\n");
    }

    function msgObjectToJson(msgs) {
        return JSON.stringify(msgs, null, 4);
    }

    function msgObjectToCsv(msgs) {
        var csv = msgs
            .map(
                ({ sender, content }, index) =>
                    `${index}, ${sender}, "${content}"`
            )
            .join("\n");
        return "Index, Sender, Message\n" + csv;
    }

    /*** CONTENTS ***/
    function getConvertedContent(fileType, msgs) {
        switch (fileType) {
            case "JSON":
                return msgObjectToJson(msgs);
                break;
            case "CSV":
                return msgObjectToCsv(msgs);
                break;
            default:
                return msgObjectToText(msgs);
        }
    }

    /*** DOWNLOAD ***/
    function downloadMessages(fileType, target) {
        var msgs = fetchMessages(target);
        var content = getConvertedContent(fileType, msgs);

        var fileExt = fileType == "Text" ? "txt" : fileType.toLowerCase();
        var blobType = "text/" + fileExt;
        var blob = new Blob([content], { type: blobType });
        var downloadUrl = URL.createObjectURL(blob);

        var downloadElement = document.createElement("a");
        downloadElement.href = downloadUrl;
        downloadElement.download = `ChatGPT_Dump_${new Date().getTime()}.${fileExt}`;
        downloadElement.style.display = "none";

        downloadElement.click();
        downloadElement.remove();

        URL.revokeObjectURL(downloadUrl);
    }

    /*** COPY TO CLIPBOARD ***/
    function copyMessages(fileType, target) {
        var msgs = fetchMessages(target);
        var content = getConvertedContent(fileType, msgs);

        navigator.clipboard
            .writeText(content)
            .then(() => alert("The content was copied to your clipboard."))
            .catch(() =>
                alert("It wasn't possible to copy to your clipboard.")
            );
    }

    var interfaceElement = createInterface();
    document.body.append(interfaceElement);
})();
