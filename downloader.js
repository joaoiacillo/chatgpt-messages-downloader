/******************************
 * ChatGPT Messages Downloader
 ******************************
 *
 * Author: João Pedro <joaopiacillo@outlook.com.br>
 * Version: 3.0.0
 */

// It is important that this script runs inside an annonymous function so it's
// variables and functions don't affect the global scope.
(function () {
    const FILE_TYPES = ["Text", "JSON", "CSV"];
    const MESSAGE_TARGETS = ["User + AI", "User", "AI"];

    console.log("Hey there!");

    const STYLE_URL =
        "https://joaoiacillo.github.io/chatgpt-messages-downloader/downloader.css";

    const INTERFACE_ID = "chat-gpt-messages-downloader-interface";

    /************************************************************************/
    /** Script Interruptions                                               **/
    /************************************************************************/

    // This blocks the script from running on other websites.
    if (!/chat\.openai\.com\/.*/.test(location.href)) {
        return alert(
            "Oh oh. Sorry but this script can only be executed in ChatGPT: https://chat.openai.com/chat"
        );
    }

    // Interrupts the script if an interface window is still open.
    if (document.getElementById(INTERFACE_ID)) return;

    /************************************************************************/
    /** Style                                                              **/
    /************************************************************************/

    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = STYLE_URL;
    document.head.append(linkElement);

    /************************************************************************/
    /** Interface                                                          **/
    /************************************************************************/

    /* Creates the default interface options window on the bottom right side. */
    function createInterface() {
        var interfaceElement = document.createElement("div");
        interfaceElement.id = INTERFACE_ID;
        interfaceElement.classList.add("cgptd-interface");

        function closeInterface() {
            interfaceElement.remove();
            linkElement.remove();
        }

        /*** Title Bar ****/

        var titleBarElement = document.createElement("div");
        titleBarElement.classList.add("cgptd-titlebar");

        var title = document.createElement("p");
        title.textContent = "Download Messages";
        title.classList.add("cgptd-title");

        var closeButton = document.createElement("button");
        closeButton.classList.add("cgptd-close");
        closeButton.textContent = "X";

        // Removes the interface from the DOM once clicked.
        closeButton.addEventListener("click", () => closeInterface());

        titleBarElement.append(title, closeButton);

        /*** Settings ***/

        function createSelectBox(options) {
            var selectElement = document.createElement("select");
            selectElement.classList.add("cgptd-selection");

            // Creates an <option> for each text option provided.
            const children = options.map((option) => {
                var element = document.createElement("option");
                element.textContent = option;
                return element;
            });

            selectElement.append(...children);

            return selectElement;
        }

        function createSetting(label, options) {
            const settingElement = document.createElement("div");
            settingElement.classList.add("cgptd-setting");

            const labelElement = document.createElement("span");
            labelElement.classList.add("cgptd-label");
            labelElement.textContent = label;

            const selectElement = createSelectBox(options);

            settingElement.append(labelElement, selectElement);
            return settingElement;
        }

        const settingsElement = document.createElement("div");
        settingsElement.classList.add("cgptd-settings");

        const fileTypeSetting = createSetting("File Type", FILE_TYPES);
        const targetsOption = createSetting("Targets", MESSAGE_TARGETS);

        settingsElement.append(fileTypeSetting, targetsOption);

        /*** Buttons ***/

        function createButton(content) {
            const buttonElement = document.createElement("button");
            buttonElement.classList.add("cgptd-button");
            buttonElement.textContent = content;
            return buttonElement;
        }

        const buttonsElement = document.createElement("div");
        buttonsElement.classList.add("cgptd-buttons");

        function callFunctionWithFileTypeAndTarget(func) {
            func(
                fileTypeSetting.children[1].value,
                targetsOption.children[1].value
            );
        }

        const downloadBtnElement = createButton("Download");
        downloadBtnElement.addEventListener("click", () =>
            callFunctionWithFileTypeAndTarget(downloadMessages)
        );

        const copyBtnElement = createButton("Copy to Clipboard");
        copyBtnElement.addEventListener("click", () =>
            callFunctionWithFileTypeAndTarget(copyMessages)
        );

        buttonsElement.append(downloadBtnElement, copyBtnElement);

        interfaceElement.append(
            titleBarElement,
            settingsElement,
            buttonsElement
        );
        return interfaceElement;
    }

    /************************************************************************/
    /** Messages Fetch                                                     **/
    /************************************************************************/

    function fetchMessages(target) {
        // This query was created by Chrome's 'Copy Selector' option from the Inspect window.
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

    /************************************************************************/
    /** Conversions                                                        **/
    /************************************************************************/

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

    /************************************************************************/
    /** Contents                                                           **/
    /************************************************************************/

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

    /************************************************************************/
    /** Download                                                           **/
    /************************************************************************/

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

    /************************************************************************/
    /** Copy to Clipboard                                                  **/
    /************************************************************************/

    function copyMessages(fileType, target) {
        var msgs = fetchMessages(target);
        var content = getConvertedContent(fileType, msgs);

        navigator.clipboard
            .writeText(content)
            .then(() => alert("The content was copied to your clipboard."))
            .catch(() =>
                alert("It was not possible to copy to your clipboard.")
            );
    }

    const interfaceElement = createInterface();
    document.body.append(interfaceElement);
})();
