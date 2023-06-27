importScripts('/script/uv.bundle.js');
importScripts("/script/uv.sw.js");
importScripts("/script/uv.config.js");

let sw = new UVServiceWorker();
let bareReady = fetchAndSetBare();

self.addEventListener('fetch', event => {
  event.respondWith(
    bareReady.then(() => {
      return sw.fetch(event).then(response => {
        // Check if the request is for an HTML document
        if (event.request.headers.get('Accept').includes('text/html')) {
          // Make sure we only modify the responses that are OK and HTML
          if (!response.ok || response.headers.get('Content-Type').indexOf('text/html') === -1) {
            return response;
          }

          return response.clone().text().then(body => {
            // Modify the HTML body
            let newBody = body.replace('</body>', `
            <script>
            
            let customScripts = JSON.parse(localStorage.getItem("customScripts")) || [];

            let modules = [
              { name: "RunJS", description: "Runs custom JavaScript", function: "executeJS" },
              { name: "ChangeURL", description: "Changes the current URL", function: "changeURL" },
              { name: "CreateModule", description: "Create a new module", function: "createModule" },
              ...customScripts
            ];
            
            function home() {
              menu.innerHTML = "";
              renderModules();
              menu.appendChild(searchInput);
              menu.appendChild(moduleContainer);
              menu.appendChild(importButton);
              menu.appendChild(importInput);
              menu.appendChild(exportButton);
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
                const prefix = __uv$config.prefix;
                const encodedUrl = __uv$config.encodeUrl(url);
                const newUrl = /^(http|https):\/\//.test(url) ? url : "https://" + url;
                window.location.href = location.origin + prefix + encodedUrl;
              });
              menu.appendChild(urlChangeButton);
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
                let newModule = { name: nameInput.value, description: descriptionInput.value, function: codeTextarea.value };
                customScripts.push(newModule);
                localStorage.setItem("customScripts", JSON.stringify(customScripts));
                modules.push(newModule);
                home();
              });
              menu.appendChild(createButton);
            }
            
            function isDefaultModule(module) {
              // Define the names of the default modules
              const defaultModuleNames = [
                "RunJS",
                "ChangeURL",
                "CreateModule"
              ];
              return defaultModuleNames.includes(module.name);
            }
            
            function deleteModule(index) {
              const module = modules[index];
              if (isDefaultModule(module)) {
                // If it's a default module, skip the deletion
                return;
              }
              modules.splice(index, 1);
              customScripts.splice(index, 1);
              localStorage.setItem("customScripts", JSON.stringify(customScripts));
            }
            
            function renderModules() {
              moduleContainer.innerHTML = "";
              modules.filter(module => module.name.toLowerCase().includes(searchInput.value.toLowerCase())).forEach((module, index) => {
                let moduleElement = document.createElement("div");
                moduleElement.innerHTML = module.name + "<br>" + module.description
                moduleElement.style.marginBottom = "20px";
            
                // Delete button for the module
                let deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.style.marginLeft = "300px";
                deleteButton.addEventListener("click", () => {
                  deleteModule(index);
                  renderModules();
                });
            
                moduleElement.appendChild(deleteButton);
                moduleContainer.appendChild(moduleElement);
            
                moduleElement.addEventListener("click", () => {
                  switch (module.function) {
                    case "executeJS":
                      executeJS();
                      break;
                    case "changeURL":
                      changeURL();
                      break;
                    case "createModule":
                      createModule();
                      break;
                    default:
                      eval(module.function);
                  }
                });
              });
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
            menu.style.backgroundColor = "#900";
            menu.style.top = "50%";
            menu.style.left = "50%";
            menu.style.transform = "translate(-50%, -50%) scale(0)";
            menu.style.transition = "transform 0.5s";
            menu.style.padding = "20px";
            menu.style.boxSizing = "border-box";
            menu.style.borderRadius = "10px";
            menu.style.overflowY = "auto";
            menu.style.fontFamily = "Arial, sans-serif";
            menu.style.fontSize = "18px";
            menu.style.color = "#FFF";
            menu.style.zIndex = "10000";
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
            
            let importButton = document.createElement("button");
            importButton.textContent = "Import JSON";
            menu.appendChild(importButton);
            
            let importInput = document.createElement("input");
            importInput.type = "file";
            importInput.style.display = "none";
            menu.appendChild(importInput);
            
            importButton.addEventListener("click", () => importInput.click());
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
            
            let exportButton = document.createElement("button");
            exportButton.textContent = "Export JSON";
            menu.appendChild(exportButton);
            
            exportButton.addEventListener("click", () => {
              let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customScripts));
              let downloadAnchorNode = document.createElement("a");
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "modules.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            });
            
            renderModules();
            
            document.addEventListener("keydown", event => {
              if (event.key === "Shift") {
                overlay.style.opacity = "1";
                overlay.style.pointerEvents = "auto";
                menu.style.transform = "translate(-50%, -50%) scale(1)";
              }
            });
            
            document.addEventListener("keydown", event => {
              if (event.key === "Escape") {
                overlay.style.opacity = "0";
                overlay.style.pointerEvents = "none";
                menu.style.transform = "translate(-50%, -50%) scale(0)";
                home();
              }
            });
            
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
