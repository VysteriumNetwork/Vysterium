importScripts('/script/bundle.js');
importScripts("/script/sw.js");
importScripts("/script/config.js");
importScripts("/script/scripts.js");
let sw = new ServiceWorker();
let bareReady = fetchAndSetBare();
sw.on("request", (event) => {
  event.data.headers["user-agent"] =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0";
});
self.addEventListener('fetch', event => {
  event.respondWith(
    bareReady.then(() => {
      return sw.fetch(event).then(response => {
        // Check if the request is for an HTML document
        if (event.request.headers.get('Accept').includes('text/html')) {
          // Make sure we only modify the responses that are OK and HTML
          if (!response.ok || !response.headers.get('Content-Type') || response.headers.get('Content-Type').indexOf('text/html') === -1) {
            return response;
          }

          return response.clone().text().then(body => {
            // Modify the HTML body
            let newBody = body.replace('</body>', `
            <script>
            let customScripts = JSON.parse(localStorage.getItem("customScripts")) || [];
            let loadedModules = JSON.parse(localStorage.getItem("loadedModules")) || [];
            
            let modules = [
              { name: "RunJS", description: "Runs custom JavaScript", "function": executeJS, toggleable: false, active: false },
              { name: "ChangeURL", description: "Changes the current URL", "function": changeURL, toggleable: false, active: false },
              { name: "CreateModule", description: "Create a new module", "function": createModule, toggleable: false, active: false },
              { name: "TabManager", description: "Manage your tab name and title", "function": tabManager, toggleable: false, active: false },
              ...customScripts,
            ];
            
            function home() {
              menu.innerHTML = "";
              renderModules();
              menu.appendChild(searchInput);
              menu.appendChild(moduleContainer);
              menu.appendChild(exportButtonDiv);
              menu.appendChild(importButtonDiv);
            }
            
            function executeJS() {
              menu.innerHTML = "";
            
              let backButton = document.createElement("button");
              backButton.textContent = "Back to modules list";
              backButton.addEventListener("click", home);
              menu.appendChild(backButton);
            
              let textarea = document.createElement("textarea");
              textarea.style.width = "100%";
              textarea.style.height = "60%";
              textarea.style.marginBottom = "20px";
              menu.appendChild(textarea);
            
              let executeButton = document.createElement("button");
              executeButton.textContent = "Execute JS";
              executeButton.addEventListener("click", () => eval(textarea.value));
              menu.appendChild(executeButton);
            }
            
            function changeURL() {
              menu.innerHTML = "";
            
              let backButton = document.createElement("button");
              backButton.textContent = "Back to modules list";
              backButton.addEventListener("click", home);
              menu.appendChild(backButton);
            
              let input = document.createElement("input");
              input.type = "text";
              input.style.width = "100%";
              input.style.marginBottom = "20px";
              menu.appendChild(input);
            
              let urlChangeButton = document.createElement("button");
              urlChangeButton.textContent = "Change URL";
              urlChangeButton.addEventListener("click", () => {
                const url = input.value.trim();
                const prefix = index$config.prefix;
                const newUrl = /^(http|https):\/\//.test(url) ? url : "https://" + url;
                window.location.href = location.origin + index$config.prefix + index$config.encodeUrl(newUrl);
              });
              menu.appendChild(urlChangeButton);
            }
            
            function tabManager() {
              menu.innerHTML = "";
            
              let backButton = document.createElement("button");
              backButton.textContent = "Back to modules list";
              backButton.addEventListener("click", home);
              menu.appendChild(backButton);
              menu.appendChild(document.createElement("br"));
            
              let tabNameLabel = document.createElement("label");
              tabNameLabel.textContent = "Tab Name:";
              tabNameLabel.style.marginRight = "10px";
              menu.appendChild(tabNameLabel);
            
              let tabNameInput = document.createElement("input");
              tabNameInput.type = "text";
              tabNameInput.style.width = "20%";
              tabNameInput.style.height = "25px";
              tabNameInput.style.marginBottom = "20px";
              tabNameInput.style.color = "black"; // Set text color to black
              menu.appendChild(tabNameInput);
              menu.appendChild(document.createElement("br"));
            
              let faviconLabel = document.createElement("label");
              faviconLabel.textContent = "Favicon URL:";
              faviconLabel.style.marginRight = "10px";
              menu.appendChild(faviconLabel);
            
              let faviconInput = document.createElement("input");
              faviconInput.type = "text";
              faviconInput.style.width = "20%";
              faviconInput.style.height = "25px";
              faviconInput.style.marginBottom = "20px";
              faviconInput.style.color = "black"; // Set text color to black
              menu.appendChild(faviconInput);
              menu.appendChild(document.createElement("br"));
            
              let apply = document.createElement("button");
              apply.textContent = "Apply";
              apply.addEventListener("click", () => {
                if(window!=window.top) {
                  alert("This will not work in an iframe!")
                } else {
                var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
              link.type = 'image/x-icon';
              link.rel = 'shortcut icon';
              link.href = faviconInput.value || "https://google.com/favicon.ico";
              document.title = tabNameInput.value || "Vysterium";
                }
              });
              menu.appendChild(apply);
            }
            
            function createModule() {
              menu.innerHTML = "";
            
              let backButton = document.createElement("button");
              backButton.textContent = "Back to modules list";
              backButton.addEventListener("click", home);
              menu.appendChild(backButton);
            
              let nameInput = document.createElement("input");
              nameInput.type = "text";
              nameInput.placeholder = "Module name";
              nameInput.style.width = "100%";
              nameInput.style.padding = "10px";
              nameInput.style.boxSizing = "border-box";
              nameInput.style.marginBottom = "20px";
              nameInput.style.borderRadius = "10px";
              nameInput.style.border = "none";
              menu.appendChild(nameInput);
            
              let descriptionInput = document.createElement("input");
              descriptionInput.type = "text";
              descriptionInput.placeholder = "Module description";
              descriptionInput.style.width = "100%";
              descriptionInput.style.padding = "10px";
              descriptionInput.style.boxSizing = "border-box";
              descriptionInput.style.marginBottom = "20px";
              descriptionInput.style.borderRadius = "10px";
              descriptionInput.style.border = "none";
              menu.appendChild(descriptionInput);
            
              let codeTextarea = document.createElement("textarea");
              codeTextarea.placeholder = "Module code";
              codeTextarea.style.width = "100%";
              codeTextarea.style.height = "60%";
              codeTextarea.style.marginBottom = "20px";
              menu.appendChild(codeTextarea);
            
              let createButton = document.createElement("button");
              createButton.textContent = "Create module";
              createButton.addEventListener("click", () => {
                let newModule = { name: nameInput.value, description: descriptionInput.value, "function": codeTextarea.value, toggleable: false, active: false };
                customScripts.push(newModule);
                localStorage.setItem("customScripts", JSON.stringify(customScripts));
                modules.push(newModule);
                home();
              });
              menu.appendChild(createButton);
            }
            
            function isDefaultModule(module) {
              // Define the names of the default modules
              const defaultModuleNames = ["RunJS", "ChangeURL", "CreateModule"];
              return defaultModuleNames.includes(module.name);
            }
            
            function deleteModule(index) {
              const module = modules[index];
              if (isDefaultModule(module)) {
                return;
              }
              modules.splice(index, 1);
              customScripts.splice(index, 1);
              localStorage.setItem("customScripts", JSON.stringify(customScripts));
            }
            
            function renderModules() {
              moduleContainer.innerHTML = "";
              modules.filter((module) => module.name.toLowerCase().includes(searchInput.value.toLowerCase())).forEach((module, index) => {
                let moduleElement = document.createElement("div");
                moduleElement.innerHTML = module.name + "<br>" + module.description;
                moduleElement.style.marginBottom = "20px";
            
                // Delete button for the module
                let deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.style.marginLeft = "10px";
                deleteButton.style.border = "1px solid black";
                deleteButton.style.borderRadius = "5px";
                deleteButton.addEventListener("click", () => {
                  deleteModule(index);
                  renderModules();
                });
            
                moduleElement.appendChild(deleteButton);
            
                if (module.toggleable) {
                  let toggleButton = document.createElement("button");
                  toggleButton.textContent = module.active ? "Active" : "Inactive";
                  toggleButton.style.marginLeft = "10px";
                  toggleButton.style.border = "1px solid black";
                  toggleButton.style.borderRadius = "5px";
                  toggleButton.addEventListener("click", () => {
                    module.active = !module.active;
                    toggleButton.textContent = module.active ? "Active" : "Inactive";
                    saveModules();
                  });
                  moduleElement.appendChild(toggleButton);
                }
            
                moduleContainer.appendChild(moduleElement);
            
                moduleElement.addEventListener("click", () => {
                  if (typeof module["function"] === "function") {
                    module["function"]();
                  } else {
                    eval(module["function"]);
                  }
                });
              });
            }
            
            function saveModules() {
              localStorage.setItem("customScripts", JSON.stringify(customScripts));
              saveLoadedModules();
            }
            
            function saveLoadedModules() {
              let loadedModuleNames = modules.filter((module) => module.active).map((module) => module.name);
              localStorage.setItem("loadedModules", JSON.stringify(loadedModuleNames));
            }
            
            let overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.opacity = "0";
            overlay.style.pointerEvents = "none";
            overlay.style.transition = "opacity 0.5s";
            overlay.style.zIndex = "9999";
            document.body.appendChild(overlay);
            
            let menu = document.createElement("div");
            menu.style.position = "fixed";
            menu.style.width = "50%";
            menu.style.height = "80%";
            menu.style.backgroundColor = "#333"; // Dark grey background
            menu.style.top = "50%";
            menu.style.left = "50%";
            menu.style.transform = "translate(-50%, -50%) scale(0)";
            menu.style.transition = "transform 0.5s";
            menu.style.padding = "20px";
            menu.style.boxSizing = "border-box";
            menu.style.borderRadius = "20px"; // Rounded corners
            menu.style.overflowY = "auto";
            menu.style.fontFamily = "Product Sans, Arial, sans-serif";
            menu.style.fontSize = "18px";
            menu.style.color = "#FFF";
            menu.style.zIndex = "10000";
            menu.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.3)"; // Add box shadow
            menu.style.outline = "2px solid white"; // Add thin white outline
            document.body.appendChild(menu);
            
            let searchInput = document.createElement("input");
            searchInput.type = "text";
            searchInput.placeholder = "Search for a module...";
            searchInput.style.width = "100%";
            searchInput.style.padding = "10px";
            searchInput.style.boxSizing = "border-box";
            searchInput.style.marginBottom = "20px";
            searchInput.style.borderRadius = "10px";
            searchInput.style.border = "none";
            menu.appendChild(searchInput);
            
            searchInput.addEventListener("input", () => {
              renderModules();
            });
            
            let moduleContainer = document.createElement("div");
            menu.appendChild(moduleContainer);
            
            let importButtonDiv = document.createElement("div");
            importButtonDiv.classList.add("mb-4");
            
            let importButtonLabel = document.createElement("label");
            importButtonLabel.textContent = "Import JSON";
            importButtonDiv.appendChild(importButtonLabel);
            
            let importButton = document.createElement("button");
            importButton.textContent = "Import";
            importButton.classList.add("ml-2"); // Add margin class for spacing
            importButton.addEventListener("click", () => importInput.click());
            importButtonDiv.appendChild(importButton);
            
            let importInput = document.createElement("input");
            importInput.type = "file";
            importInput.style.display = "none";
            importInput.addEventListener("change", async () => {
              let file = importInput.files[0];
              if (!file) return;
              let fileText = await file.text();
              let newScripts;
              try {
                newScripts = JSON.parse(fileText);
              } catch (e) {
                console.error("Invalid JSON file:", e);
                return;
              }
              customScripts = [...customScripts, ...newScripts];
              localStorage.setItem("customScripts", JSON.stringify(customScripts));
              modules = [...modules, ...newScripts];
              renderModules();
            });
            importButtonDiv.appendChild(importInput);
            
            menu.appendChild(importButtonDiv);
            
            let exportButtonDiv = document.createElement("div");
            exportButtonDiv.classList.add("mb-4");
            
            let exportButtonLabel = document.createElement("label");
            exportButtonLabel.textContent = "Export JSON";
            exportButtonDiv.appendChild(exportButtonLabel);
            
            let exportButton = document.createElement("button");
            exportButton.textContent = "Export";
            exportButton.classList.add("ml-2"); // Add margin class for spacing
            exportButton.addEventListener("click", () => {
              let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customScripts));
              let downloadAnchorNode = document.createElement("a");
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "modules.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            });
            exportButtonDiv.appendChild(exportButton);
            
            menu.appendChild(exportButtonDiv);
            
            renderModules();
            
            document.addEventListener("keydown", (event) => {
              if (event.key === "Shift") {
                overlay.style.opacity = "1";
                overlay.style.pointerEvents = "auto";
                menu.style.transform = "translate(-50%, -50%) scale(1)";
              }
            });
            
            document.addEventListener("keydown", (event) => {
              if (event.key === "Escape") {
                overlay.style.opacity = "0";
                overlay.style.pointerEvents = "none";
                menu.style.transform = "translate(-50%, -50%) scale(0)";
                home();
              }
            });
            
            function loadModules() {
              loadedModules.forEach((moduleName) => {
                const module = modules.find((m) => m.name === moduleName);
                if (module) {
                  module.active = true;
                }
              });
            }
            
            loadModules();
            </script></body>`);
            
            // Create a new response
            return new Response(newBody, {
              headers: response.headers
            });
          });
        } else {
          return response;
        }
      });
    })
  );
});