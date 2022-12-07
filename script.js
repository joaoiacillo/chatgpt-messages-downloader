/**
 * ===========================
 * ChatGPT Messages Downloader
 * ===========================
 *
 * Author: João Pedro Iacillo Soares <joaopiacillo@outlook.com.br>
 * Version: 1.0.0
 */

(function () {
    const cgpt_url_pattern = /chat\.openai\.com\/.*/;

    // Blocks the script from running on any other website rather than CGPT's one.
    if (!cgpt_url_pattern.test(location.href))
        return alert(
            "You must execute this in ChatGPT website: https://chat.openai.com/chat"
        );

    const download_type = "text"; // Change this to "json" if you want to download as JSON file.
    const blob_types = {
        text: "text/plain",
        json: "text/json",
    };

    if (!(download_type in blob_types))
        return alert(
            `Oh oh. It seems we ran into some trouble: The download type "${download_type}" provided is not correct. :(\n\nPlease visit the project's repository on GitHub and favorite one of the links provided.\n\nIf you feel that everything is correct, please report this to the creator: joaopiacillo@outlook.com.br`
        );

    // This query was created by Chrome's "Copy Selector" option from the Inspect window.
    const msg_list_el = document.querySelector(
        "#__next > div > div.flex.flex-1.flex-col.md\\:pl-52.h-full > main > div.flex-1.overflow-hidden > div > div > div"
    );

    const msgs_list = [...msg_list_el.children];
    // We pop the array since the msg list has an empty div for interface spacing at it's end.
    msgs_list.pop();

    var msgs_dump = [];

    for (let msg_el of msgs_list) {
        const content = msg_el.querySelector(
            "div > div:nth-child(2) > div"
        ).textContent;

        const profile_pic_div = msg_el.children[0].firstChild.firstChild;
        // We're checking over the classList length because the AI profile
        // picture has a way higher amount of class names compared to the
        // user's one, which is always only 2.
        const is_ai_msg = profile_pic_div.classList.length > 2;

        const sender = is_ai_msg ? "AI" : "User";

        msgs_dump.push({
            sender: sender,
            content: content,
        });
    }

    var blob_content;
    var blob_file_ext;

    switch (download_type) {
        case "text": {
            blob_file_ext = "txt";
            blob_content = msgs_dump
                .map(({ sender, content }) => `${sender}: ${content}`)
                .join("\n");
            break;
        }
        case "json": {
            blob_file_ext = "json";
            blob_content = JSON.stringify(msgs_dump, null, 4);
        }
    }

    const blob_type = blob_types[download_type];
    const blob = new Blob([blob_content], { type: blob_type });
    const downloadUrl = URL.createObjectURL(blob);

    const a_el = document.createElement("a");
    a_el.href = downloadUrl;
    a_el.download = `ChatGPT_Dump_${new Date().getTime()}.${blob_file_ext}`;
    a_el.style.display = "none";

    a_el.click();
    a_el.remove();

    URL.revokeObjectURL(downloadUrl);
})();
